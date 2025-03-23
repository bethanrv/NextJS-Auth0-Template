import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FeedContent from "./FeedContent";
import { getSession } from "@auth0/nextjs-auth0";

interface Fight {
  id : number
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
  poster_image_url: string | null,
  fighter_1_full_name: string,
  fighter_2_full_name: string,
  fighter_1_img: string,
  fighter_2_img: string,
}

interface dbEvent {
  id: string;
  sport_key : string;
  sport_title : string;
  commence_time : string;
  completed : string;
  home_team : string;
  away_team : string;
  home_team_price: number;
  away_team_price: number;
  scores : string | null;
  last_updated : string | null;
}

interface Auth0User {
  sub: string;
  name: string;
  nickname: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

interface DbUser {
  id: string;
  sub: string;
  name: string;
  nickname: string;
  picture: string;
  email: string;
  email_verified: boolean;
  tokens: number;
  created_at: string;
  updated_at: string;
}

// Return past events
function filterPastEvents(events: Fight[]):Fight[] {
  if (!events || !Array.isArray(events))
    throw new Error("events not array: " + events);
  let pastEvents: Fight[] = [];
  events.forEach((event: Fight) => {
    if (event.status === "FINISHED") pastEvents.push(event);
  });
  return pastEvents;
}

// Return current events (non-complete and already commenced)
function filterCurrentEvents(events: Fight[]):Fight[] {
  if (!events || !Array.isArray(events))
    throw new Error("events not array: " + events);
  const currentTime = new Date();
  let currentEvents: Fight[] = [];
  events.forEach((event: Fight) => {
    if (event.status !== "FINISHED" && new Date(event.date) < currentTime)
      currentEvents.push(event);
  });
  return currentEvents;
}

// Return upcoming events
function filterUpcomingEvents(events: Fight[]):Fight[] {
  if (!events || !Array.isArray(events))
    throw new Error("events not array: " + events);
  const currentTime = new Date();
  let upcomingEvents: Fight[] = [];
  events.forEach((event: Fight) => {
    if (event.status === "NOT_STARTED")
      upcomingEvents.push(event);
  });
  return upcomingEvents;
}

// insert new user
async function insertUser(session: { user: Auth0User }, supabase: any): Promise<DbUser> {
  if (!session?.user) {
    throw new Error("No user data in session");
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      sub: session.user.sub,
      name: session.user.name,
      nickname: session.user.nickname,
      picture: session.user.picture,
      email: session.user.email,
      email_verified: session.user.email_verified,
      tokens: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      // User already exists, fetch their data
      return await getDBUserInfo(session, supabase);
    }
    console.error('Insert error:', error);
    throw error;
  }

  return data;
}

async function getDBUserInfo(session: { user: Auth0User }, supabase: any): Promise<DbUser> {
  console.log('Getting DB user info for sub:', session.user.sub);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('sub', session.user.sub)
    .single();

  if (error) {
    console.error('Error getting user db info:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }

  if (!data) {
    console.log('No user found for sub:', session.user.sub);
    throw new Error('User not found');
  }

  console.log('Found user data:', data);
  return data;
}

async function getDatabaseUser(session: { user: Auth0User }, supabase: any): Promise<DbUser> {
  try {
    console.log('Attempting to get existing user for sub:', session.user.sub);
    // Try to get existing user
    const existingUser = await getDBUserInfo(session, supabase);
    return existingUser;
  } catch (error: any) {
    console.log('Error in getDatabaseUser:', error);
    // If user doesn't exist, create them
    if (error?.code === 'PGRST116') { // Not found error
      console.log('User not found, creating new user for sub:', session.user.sub);
      return await insertUser(session, supabase);
    }
    throw error;
  }
}

function getTokenCount(dbUserInfo: DbUser[]) {

}

async function FeedPage() {
  // Create Supabase client and query events
  const supabase = await createClient();
  let { data: events, error } = await supabase.from("fights").select();
  console.log("Fights:", events, "Error:", error);
  events = events as Fight[]

  // filter events
  const currentEvents = filterCurrentEvents(events)
  const upcomingEvents = filterUpcomingEvents(events)
  const pastEvents = filterPastEvents(events)

  // get auth0 session
  const session = await getSession();
  let dbUserInfo: DbUser | null = null;

  if (session?.user) { // get user from db
    console.log('session ============')
    try {
      dbUserInfo = await getDatabaseUser(session as { user: Auth0User }, supabase);
      console.log('db user info')
      console.log(dbUserInfo)
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <FeedContent 
          currentEvents={currentEvents}
          upcomingEvents={upcomingEvents}
          pastEvents={pastEvents}
          initialTokenBalance={dbUserInfo?.tokens ?? 100}
          isLoggedIn={!!session?.user}
        />
      </div>
    </div>
  )
}
export default FeedPage;