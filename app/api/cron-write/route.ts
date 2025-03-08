import { createClient } from '@/utils/supabase/server';
import { rejects } from 'assert';
import { NextResponse } from 'next/server';
import { resolve } from 'path';

interface Outcome {
  name: string;
  price: number;
}

interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

interface fight {
  id: string;
  sport_key : string;
  sport_title : string;
  commence_time : string;
  completed : string;
  home_team : string;
  away_team : string;
  bookmakers: Bookmaker[];
  scores : string | null;
}

interface OddsResponse {
  id: string;
  sport_key : string;
  sport_title : string;
  commence_time : string;
  completed : string;
  home_team : string;
  away_team : string;
  bookmakers: Bookmaker[];
}

interface ScoreResponse {
  id : string;
  sport_key : string;
  sport_title : string;
  commence_time : string;
  completed : string;
  home_team : string;
  away_team : string;
  scores : string | null;
  last_updated : string | null;
}

interface Event {
  id: string;
  sport_key : string;
  sport_title : string;
  commence_time : string;
  completed : string;
  home_team : string;
  away_team : string;
  bookmakers: Bookmaker[];
  scores : string | null;
  last_updated : string | null;
}

const preferedMarket = 'DraftKings'

export async function GET(request: Request) {
  // Authorization check first
  const authHeader = request.headers.get('Authorization');
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
        console.log('get scores failed: ' + e)
        throw e
    }
  }

  // get odds from odds api
  async function getOdds() {
    try{
        const baseUrl = 'https://api.the-odds-api.com/v4/sports/boxing_boxing/odds'
        const params = new URLSearchParams({
            apiKey: process.env.ODDS_API_KEY ? process.env.ODDS_API_KEY : '',
            regions: 'us',
            oddsFormat: 'american' ,
            daysFrom: '3'
        })
        const response = await fetch(`${baseUrl}?${params}`)
        if(!response.ok) throw new Error(`HTTP error status: ${response.status}`)
        const data = response.json()
        return data
    }
    catch(e) {
        console.log('get odds failed: ' + e)
        throw e
    }
  }

  // get scores from odds api
  async function getScores() {
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
  async function dbContainsEvent(event: Event){
    const { data, error } = await supabase.from('events').select('*').eq('id', event.id);
    if (error) {
      console.error('dbContainsEvent query error:', error);
      throw error;
    }
    return (data && data.length > 0)
  }

  // check if a event is already complete
  async function getEventCompleted(event: Event) {
    // get event complete data
    const { data, error } = await supabase.from('events').select('completed').eq('id', event.id);
    if (error) {
        console.error('getEventCompleted query error:', error);
        throw error;
    }
    return false
  }

  // check if a bookmarker contains our prefered market
  function hasPreferedMarket(event : Event) {
    for(const bookmarker of event.bookmakers) {
      if ( bookmarker.title == preferedMarket )
        return true
    }
    return false
  }

  // get bookmarker from prefered market
  function getPreferedBookmarker(event : Event) {
    for(const bookmarker of event.bookmakers) {
      if ( bookmarker.title == preferedMarket )
        return bookmarker
    }
    throw new Error("Error getting prefered market: market not found")
  }

  // get price of given outcome for given player
  function getOutcomePrice(name: string, outcomes: Outcome[]) {
    for(const outcome of outcomes) {
      if ( outcome.name == name ) {
        return outcome.price
      }
    }
    console.log('Warning: outcome not found')
    return 0;
  }

  // get bookmarker price for home team
  function getHomeTeamPrice(event : Event) {
    try{
      if(!event.bookmakers[0].markets[0]){
        return 0
      }

      if( hasPreferedMarket(event) ) {
        const preferedBookmarker = getPreferedBookmarker(event)
        return getOutcomePrice(event.home_team, preferedBookmarker.markets[0].outcomes)
      }else{
        return getOutcomePrice(event.home_team, event.bookmakers[0].markets[0].outcomes)
      }
    } catch (e) {
      console.log('Error getting home team price: ' + e)
      return 0
    }
  }

  // get bookmarker price for away team
  function getAwayTeamPrice(event : Event) {
    try{
      if(!event.bookmakers[0].markets[0]){
        return 0
      }
      if( hasPreferedMarket(event) ) {
        const preferedBookmarker = getPreferedBookmarker(event)
        return getOutcomePrice(event.away_team, preferedBookmarker.markets[0].outcomes)
      }else{
        return getOutcomePrice(event.away_team, event.bookmakers[0].markets[0].outcomes)
      }
    } catch (e) {
      console.log('Error getting away team price: ' + e)
      return 0
    }
  }

  async function insertEvent(event: Event) {

    const homeTeamPrice = getHomeTeamPrice(event)
    const awayTeamPrice = getAwayTeamPrice(event)

    const { data, error } = await supabase
      .from('events')
      .insert({
        id: event.id,
        sport_key: event.sport_key,
        sport_title: event.sport_title,
        commence_time: event.commence_time,
        completed: event.completed,
        home_team: event.home_team,
        away_team: event.away_team,
        scores: null,
        last_updated: null,
        home_team_price: homeTeamPrice,
        awayTeamPrice: awayTeamPrice 
      })
      .select('*')
      .single();
    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    return data;
  }

  async function updateOdds(event: Event) {
    try {

      if(event.bookmakers.length == 0) return

      const homeTeamPrice = getHomeTeamPrice(event)
      const awayTeamPrice = getAwayTeamPrice(event)
  
      const { data, error } = await supabase
        .from('events')
        .update({
          home_team_price: homeTeamPrice,
          away_team_price: awayTeamPrice
        })
        .eq('id', event.id);
  
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Update error:', error);
      return null;
    }
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

  function combineOddsAndScoreData(oddsData : OddsResponse[], scoresData : ScoreResponse[]) {
    let events = []
    for(const odds of oddsData) {
      let event = odds as Event
      for (const score of scoresData) {
        if ( odds.id == score.id ) {
          event.scores = score.scores
          event.last_updated = score.last_updated
          break
        } 
      }
      events.push(event)
    }
    return events
  }

  // create or update fight events in db
  // get from /odds
  // insert if new
  async function updateFights() {

    const oddsData = await getOdds() as Event[] // get /odds

    // some metrics to log...  
    let apiEventCount = oddsData.length
    let insertedCount = 0
    let updateCount = 0

    // for each event, insert new & update completed
    for ( const event of oddsData ) {
        if (!dbContainsEvent(event)) { // event not yet in db -> add it
            const insertRes = await insertEvent(event)
            insertedCount++
        }else{ // event in db -> check for score update
            // if( event.completed == "true" && (!await getEventCompleted(event)) ) { 
            //     console.log('updating event')
            //     updateEvent(event)
            //     updateCount++
            // }
            // updateOdds(event) // aslo update odds 
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
    await updateFights()
    const { data, error } = await supabase.from('testTbl').select('*');
    if (error) throw error;
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
