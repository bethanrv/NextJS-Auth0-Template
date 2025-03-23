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

export async function GET() {
  try {
    const supabase = await createClient();
    let processedCount = 0;
    let errorCount = 0;

    // Get all completed fights that haven't been processed for payouts
    const { data: completedFights, error: fightsError } = await supabase
      .from('fights')
      .select('*')
      .eq('status', 'FINISHED')
      .eq('result_outcome', 'COMPLETED');

    if (fightsError) {
      console.error('Error fetching completed fights:', fightsError);
      return NextResponse.json({ error: 'Failed to fetch completed fights' }, { status: 500 });
    }

    if (!completedFights || completedFights.length === 0) {
      return NextResponse.json({ message: 'No completed fights to process' });
    }

    console.log(`Processing ${completedFights.length} completed fights`);

    // Process each completed fight
    for (const fight of completedFights) {
      console.log(`Processing fight ${fight.id}: ${fight.fighter_1_name} vs ${fight.fighter_2_name}`);
      
      // Get all bets for this fight that haven't been completed
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('fight_id', fight.id)
        .eq('completed', false);

      if (betsError) {
        console.error(`Error fetching bets for fight ${fight.id}:`, betsError);
        errorCount++;
        continue;
      }

      if (!bets || bets.length === 0) {
        console.log(`No pending bets found for fight ${fight.id}`);
        continue;
      }

      console.log(`Processing ${bets.length} bets for fight ${fight.id}`);

      // Process each bet
      for (const bet of bets) {
        try {
          // Determine if the bet was won
          const isWinner = bet.selected_fighter === fight.result_outcome;
          console.log(`Bet ${bet.id}: User ${bet.user_id} bet on ${bet.selected_fighter} - ${isWinner ? 'WON' : 'LOST'}`);

          // Calculate payout (2x for winners, 0 for losers)
          const payout = isWinner ? bet.stake * 2 : 0;

          // Start a transaction
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('tokens')
            .eq('id', bet.user_id)
            .single();

          if (userError) {
            console.error(`Error fetching user ${bet.user_id}:`, userError);
            errorCount++;
            continue;
          }

          const currentTokens = userData?.tokens || 0;
          const newTokenBalance = currentTokens + payout;

          // Update user's token balance
          const { error: updateError } = await supabase
            .from('users')
            .update({ tokens: newTokenBalance })
            .eq('id', bet.user_id);

          if (updateError) {
            console.error(`Error updating tokens for user ${bet.user_id}:`, updateError);
            errorCount++;
            continue;
          }

          // Mark bet as completed
          const { error: betUpdateError } = await supabase
            .from('bets')
            .update({ 
              completed: true,
              payout: payout,
              result: isWinner ? 'WIN' : 'LOSS'
            })
            .eq('id', bet.id);

          if (betUpdateError) {
            console.error(`Error marking bet ${bet.id} as completed:`, betUpdateError);
            errorCount++;
            continue;
          }

          console.log(`Successfully processed bet ${bet.id}: User ${bet.user_id} ${isWinner ? 'won' : 'lost'} ${payout} tokens`);
          processedCount++;
        } catch (error) {
          console.error(`Error processing bet ${bet.id}:`, error);
          errorCount++;
        }
      }
    }

    return NextResponse.json({ 
      message: 'Bet processing completed',
      processedBets: processedCount,
      errors: errorCount,
      totalFights: completedFights.length
    });

  } catch (error) {
    console.error('Error in cron-update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
