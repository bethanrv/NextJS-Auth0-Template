import { createClient } from '@/utils/supabase/server';
import { rejects } from 'assert';
import { NextResponse } from 'next/server';
import { resolve } from 'path';

interface Fighter {
  name : string;
  full_name : string | null;
  fighter_id : string;
}

interface FighterList {
  fighter_1 : Fighter;
  fighter_2 : Fighter;
}

interface Division {
  name : string;
  weight_lb: number;
}

interface Event {
  poster_image_url : string | null
}

interface Fight {
  title : string;
  slug : string;
  date : string;
  location : string;
  status : string;
  scheduled_rounds : number;
  fighters : FighterList;
  division : Division;
  id : string;
  event : Event
}

interface ImageDetails {
  src : string
}

interface Pagemap {
  cse_image : ImageDetails[]
}

interface SearchItem {
  pagemap : Pagemap
}

interface ImageSearchResult {
  items : SearchItem[]
}

// Fetch fights for next week from boxing-data-api
async function fetchFightSchedule() {
  try {
    const url = new URL('https://boxing-data-api.p.rapidapi.com/v1/fights/schedule');
    const params = {
      days: 7,
      date_sort: 'ASC',
      page_num: 1,
      page_size: 25
    };

    // Add query parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    if (!process.env.BOXING_API_KEY) {
      throw new Error('BOXING_API_KEY is not defined');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.BOXING_API_KEY,
        'X-RapidAPI-Host': 'boxing-data-api.p.rapidapi.com'
      },
      cache: 'no-store' // Bypass cache for fresh data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching fight schedule:', error);
    throw error;
  }
}

// check if our db has this fight id already
async function dbHasFight(supabase : any, id : string) {
  const { data, error } = await supabase.from('fights').select('*').eq('event_id', id);
  if (error) {
    console.error('dbHasFight query error:', error);
    throw error;
  }
  return (data && data.length > 0)
}

// make search request
async function googleImageSearch(query : string) {
  try {

    console.log('Searching ' + query)

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    const params = {
      key: process.env.GOOGLE_SEARCH_KEY?process.env.GOOGLE_SEARCH_KEY:'',
      cx: 'c3b7eab4226b246e7',
      q:query
    };

    // Add query parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error fetching fight schedule:', error);
    throw error;
  }
}

// get image url from image search result
async function getAvailableImage(imageRes : ImageSearchResult) {
  for(const searchItem of imageRes.items) {
    if ( searchItem.pagemap.cse_image) {
      if ( !searchItem.pagemap.cse_image[0].src 
        || !searchItem.pagemap.cse_image[0].src.startsWith('http') 
        || !( 
            searchItem.pagemap.cse_image[0].src.endsWith('jpg')
            || searchItem.pagemap.cse_image[0].src.endsWith('jpeg')
            || searchItem.pagemap.cse_image[0].src.endsWith('png') 
            || searchItem.pagemap.cse_image[0].src.endsWith('webp') 
          )
        ) continue
      return searchItem.pagemap.cse_image[0].src
    } 
  }
  return ''
}

// get image for a fighter
async function getFighterImg(fighter: Fighter, fight: Fight) {
  try {
    const fighterNameForQuery = fighter.full_name || fighter.name;
    if (!fighterNameForQuery) return null;

    const filterOut = "-boxrec -youtube -instagram -facebook"
    const fighterImageQuery = `${fighterNameForQuery} boxer portriat ${filterOut}`;
    console.log('searching ' + fighterImageQuery)
    const imageRes = await googleImageSearch(fighterImageQuery) as ImageSearchResult;
    
    return getAvailableImage(imageRes) || null;
  } catch (error) {
    console.error('Image search failed:', error);
    return null;
  }
}


// add new fight
async function insertFight(supabase : any, fight : Fight) {

  // get fighter images before adding
  const fight_1_img = await getFighterImg(fight.fighters.fighter_1, fight)
  const fight_2_img = await getFighterImg(fight.fighters.fighter_2, fight)

  const { data, error } = await supabase
    .from('fights')
    .insert({
      event_id: fight.id,
      title : fight.title,
      slug : fight.slug,
      date : fight.date,
      location : fight.location,
      status : fight.status,
      scheduled_rounds : fight.scheduled_rounds,
      fighter_1_name : fight.fighters.fighter_1.name,
      fighter_2_name : fight.fighters.fighter_2.name,
      fighter_1_id : fight.fighters.fighter_1.fighter_id,
      fighter_2_id :  fight.fighters.fighter_2.fighter_id,
      division_name : fight.division.name,
      division_weight_lb : fight.division.weight_lb,
      poster_image_url : fight.event.poster_image_url,
      fighter_1_full_name : fight.fighters.fighter_1.full_name?fight.fighters.fighter_1.full_name:fight.fighters.fighter_1.name,
      fighter_2_full_name : fight.fighters.fighter_2.full_name?fight.fighters.fighter_2.full_name:fight.fighters.fighter_2.name,
      fighter_1_img : fight_1_img,
      fighter_2_img : fight_2_img,
    })
    .select('*')
    .single();
  if (error) {
    console.error('Insert error:', error);
    throw error;
  }
  return data;
}

// sleep util
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// update fights in supbase
async function updateFights(supabase: any) {
  try {
    const fightSchedule = await fetchFightSchedule() as Fight[];
    
    for (const fight of fightSchedule) {
      try {
        if (!(await dbHasFight(supabase, fight.id))) {
          await insertFight(supabase, fight);
          await sleep(4000); // Rate limit after successful insert
        }
      } catch (fightError) {
        console.error(`Error processing fight ${fight.id}:`, fightError);
        // Consider adding retry logic here if needed
      }
    }
    
    return { success: true, count: fightSchedule.length };
  } catch (error) {
    console.error('Failed to update fights:', error);
    return { success: false, error };
  }
}

// delete from fights (for testing)
async function deleteFights(supabase : any) {
  const { data, error } = await supabase
  .from('fights')
  .delete()
  .not('id', 'is', null);
}


export async function GET(request: Request) {

  // Authorization check first
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }

  // start db client
  const supabase = await createClient();

  // await deleteFights(supabase)

  // test search
  // const searchRes = await googleImageSearch("Turner, Boxer, Flyweight")
  // for(const item of searchRes.items) {
  //   console.log(item.pagemap.cse_image)
  // }
  
  // add new fights
  try {
    await updateFights(supabase) // get fights from the betting api and add any new results
    return NextResponse.json({
      success: true
    });
  } catch (err: any) {
    console.error('Cron job failed:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
