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

// add new fight
async function insertFight(supabase : any, fight : Fight) {
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
      poster_image_url : fight.event.poster_image_url
    })
    .select('*')
    .single();
  if (error) {
    console.error('Insert error:', error);
    throw error;
  }
  return data;
}

// update fights in supbase
async function updateFights(supabase : any) {
  
  // get fight schedule
  const fightSchedule = await fetchFightSchedule() as Fight[]

  // add new fights
  for( const fight of fightSchedule ) {
    if ( !(await dbHasFight(supabase, fight.id)) ) {
      insertFight(supabase, fight)
    }
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
