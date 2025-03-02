import { createClient } from '@/utils/supabase/server';
import { rejects } from 'assert';
import { NextResponse } from 'next/server';
import { resolve } from 'path';

interface ScoreResponse {
    id : string,
    sport_key : string,
    sport_title : string,
    commence_time : string,
    completed : string,
    home_team : string,
    away_team : string,
    scores : string,
    last_updated : string
}

export async function GET(request: Request) {
  // Authorization check first
  const authHeader = request.headers.get('Authorization');
  console.log('authHeader')
  console.log(authHeader)
  console.log('process.env.CRON_SECRET')
  console.log(process.env.CRON_SECRET)
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }

  // Request upcoming and completed fights
  async function getFights() {
    try{
        const baseUrl = 'https://api.the-odds-api.com/v4/sports/boxing_boxing/scores'
        const params = new URLSearchParams({
            apiKey: process.env.ODDS_API_KEY ? process.env.ODDS_API_KEY : '',
            regions: 'us',
            daysFrom: '3'
        })
        const response = await fetch(`${baseUrl}?${params}`)
        if(!response.ok) throw new Error(`HTTP error status: ${response.status}`)
        const data = response.json()
        return data
    }
    catch(e) {
        console.log('getFights failed: ' + e)
        throw e
    }
  }

  // Check if the database contains the given event
  async function dbContainsEvent(fight: ScoreResponse){
    const { data, error } = await supabase.from('events').select('*').eq('id', fight.id);
    if (error) {
      console.error('dbContainsEvent query error:', error);
      throw error;
    }
    return (data && data.length > 0)
  }

  // check if a event is already complete
  async function getEventCompleted(fight: ScoreResponse) {
    // get event complete data
    const { data, error } = await supabase.from('events').select('completed').eq('id', fight.id);
    if (error) {
        console.error('getEventCompleted query error:', error);
        throw error;
    }
    console.log('event completed data:')
    console.log(data)
    return false
  }

  async function insertEvent(fight: ScoreResponse) {
    const { data, error } = await supabase
      .from('events')
      .insert({
        id: fight.id,
        sport_key: fight.sport_key,
        sport_title: fight.sport_title,
        commence_time: fight.commence_time,
        completed: fight.completed,
        home_team: fight.home_team,
        away_team: fight.away_team,
        scores: fight.scores,
        last_updated: fight.last_updated
      })
      .select('*')
      .single();
    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    return data;
  }

  async function updateEvent(fight:ScoreResponse) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          sport_key: fight.sport_key,
          scores: fight.scores,
          completed: fight.completed,
          last_updated: new Date().toISOString()
        })
        .eq('id', fight.id)
        .select('*')
        .single();
  
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Update error:', error);
      return null;
    }
  }

  // create or update fight events in db
  async function updateFights(fights : ScoreResponse[]) {
    let apiEventCount = fights.length
    let insertedCount = 0
    let updateCount = 0
    for ( const fight of fights ) {
        if (!dbContainsEvent(fight)) { // event not yet in db -> add it
            const insertRes = await insertEvent(fight)
            insertedCount++
        }else{ // event in db -> check for score update
            // api res fight completed, db event not complete, then update db with final score
            if( fight.completed == "true" && (!await getEventCompleted(fight)) ) { 
                updateEvent(fight)
                updateCount++
            }
        }
    }

    // monitoring
    console.log('Update Summary:')
    console.log(`API found ${apiEventCount} items`)
    console.log(`Inserted ${insertedCount} new items`)
    console.log(`Updated ${updateCount} completed items`)
  }

  // Proceed with database operations after successful auth
  const supabase = await createClient();
  
  try {
    const fights = await getFights()
    await updateFights(fights)
    const { data, error } = await supabase.from('testTbl').select('*');
    if (error) throw error;
    console.log('Cron job results:', data);
    return NextResponse.json({
      success: true,
      count: data.length,
      results: data
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
