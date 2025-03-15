import { createClient } from '@/utils/supabase/server';
import { rejects } from 'assert';
import { NextResponse } from 'next/server';
import { resolve } from 'path';

interface DbFight {
  created_at: string,
  title: string,
  slug: string,
  date: string,
  location: string,
  status: string,
  scheduled_rounds: number,
  result_outcome: string | null,
  result_round: string | null,
  fighter_1_name: string,
  fighter_2_name: string,
  fighter_1_id: string | null,
  fighter_2_id: string | null,
  fighter_1_is_winner: string | null,
  fighter_2_is_winner: string | null,
  division_name: string | null,
  division_weight_lb: number,
  event_id: string,
  poster_image_url: string | null
}

interface Fighter {
  name : string;
  full_name : string | null;
  fighter_id : string;
  winner : boolean
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

interface Result {
  outcome : string
  round : string
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
  event : Event;
  results : Result | null;
}

// get a fight by id
async function getFight(event_id : number) {
  try {
    const url = new URL('https://boxing-data-api.p.rapidapi.com/v1/fights/' + event_id);

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

// update fight in db
async function updateFight(supabase : any, fight : Fight, id : number) {
  const { data, error } = await supabase
    .from('fights')
    .update({
      status : fight.status,
      result_outcome : fight.results?.outcome,
      result_round : fight.results?.round,
      fighter_1_is_winner : fight.fighters.fighter_1.winner,
      fighter_2_is_winner : fight.fighters.fighter_2.winner
    })
    .eq('id', id)
    .select()
  if (error) throw new Error(`Update failed: ${error.message}`);
  return data
}

// update fights in supbase if the event is over
async function updateFights(supabase : any) {
  
  // check which events could have an update available (not finished and has started)
  const { data, error } = await supabase
    .from('fights')
    .select('*')
    .neq('status', 'FINISHED')
    .lt('date', new Date().toISOString());
  if (error) {
    console.error('Insert error:', error);
    throw error;
  }

  // any fights to check?
  if(data && data.length > 0) {
    for (const fight of data) {
      const updatedFight = await getFight(fight.event_id) as Fight // get updated data
      if (updatedFight.status == 'FINISHED') {
        const updateFightRes = await updateFight(supabase, updatedFight, fight.id) // add update to db
        console.log(updateFightRes)
      }
    }
  }else{ // no fights to update
    console.log('No updates')
  }
}

async function testFights(supabase : any) {
  const { data, error } = await supabase
    .from('fights')
    .select('*')
  console.log('test')
  console.log(data)
}

async function addTestFight(supabase:any) {
  const { data, error } = await supabase
    .from('fights')
    .insert({
      event_id: '67988ef050bc3718f6702d90',
      title : 'test',
      slug : 'test',
      date : "2025-03-13T11:00:00",
      location : 'test',
      status : 'NOT_FINISHED',
      scheduled_rounds : 12,
      fighter_1_name : 'tester',
      fighter_2_name : 'tester 2',
      fighter_1_id : 'test',
      fighter_2_id :  'test',
      division_name : 'test div',
      division_weight_lb : 100,
      poster_image_url : 'test img'
    })
    .select('*')
    .single();
  if (error) {
    console.error('Insert error:', error);
    throw error;
  }
  return data;
}

async function deleteTest(supabase: any) {
  // delete from fights (for testing)
  const { data, error } = await supabase
  .from('fights')
  .delete()
  .eq('id', 23)
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

  // test fights
  // await testFights(supabase)

  // add test fight
  // await addTestFight(supabase)

  // delete test fight
  // await deleteTest(supabase)

  // update fights with final results
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
