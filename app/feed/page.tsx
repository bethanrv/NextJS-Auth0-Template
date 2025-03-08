import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FeedItem from "./FeedItem"; // Adjust the import path as necessary
import ProfileImage from "@/components/ProfileImage";
import { getSession } from "@auth0/nextjs-auth0";



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


interface Session {
  accessToken: string;
  accessTokenExpiresAt: number;
  accessTokenScope: string;
  idToken: string;
  token_type: string;
  user: User;
}

interface User {
  email: string;
  email_verified: boolean;
  given_name: string,
  name: string;
  nickname: string;
  picture: string;
  sid: string;
  sub: string;
  updated_at: string;
}

interface DbUser {
  id: number | null;
  name: string | null;
  nickname: string | null;
  sid: string  | null;
  tokens: number | null;
}

// Return past events
function filterPastEvents(events: dbEvent[]):dbEvent[] {
    if (!events || !Array.isArray(events))
      throw new Error("events not array: " + events);
    let pastEvents: dbEvent[] = [];
    events.forEach((event: dbEvent) => {
      if (event.completed === "true") pastEvents.push(event);
    });
    return pastEvents;
}
  
// Return current events (non-complete and already commenced)
function filterCurrentEvents(events: dbEvent[]):dbEvent[] {
    if (!events || !Array.isArray(events))
      throw new Error("events not array: " + events);
    const currentTime = new Date();
    let currentEvents: dbEvent[] = [];
    events.forEach((event: dbEvent) => {
      if (event.completed === "false" && new Date(event.commence_time) < currentTime)
        currentEvents.push(event);
    });
    return currentEvents;
}
  
// Return upcoming events
function filterUpcomingEvents(events: dbEvent[]):dbEvent[] {
    if (!events || !Array.isArray(events))
      throw new Error("events not array: " + events);
    const currentTime = new Date();
    let upcomingEvents: dbEvent[] = [];
    events.forEach((event: dbEvent) => {
      if (event.completed === "false" && new Date(event.commence_time) > currentTime)
        upcomingEvents.push(event);
    });
    return upcomingEvents;
}

// insert new user
async function insertUser(session : Session, supabase : any) {

  if (!session?.user)
    throw new Error("Error on insertUser, session: " + session)

  const { data, error } = await supabase
    .from('users')
    .insert({
      sid: session.user.sid,
      name: session.user.name,
      nickname: session.user.nickname,
      tokens: 100
    })
    .select('*')
    .single();
  if (error) {
    console.error('Insert error:', error);
    throw error;
  }

  console.log('insert res =========')
  console.log(data)
  return data;
}

async function isUserInDB(session: Session, supabase: any) {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('sid', session.user.sid);

    if (error) throw error;
    return (count || 0) > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}

async function getDBUserInfo(session: Session, supabase: any) {
  try{
    const {data, error} = await supabase.from('users').select('*').eq('sid', session.user.sid);
    if (error) throw error;
    return data
  }catch (error) {
    console.error('Error getting user  db info:', error);
    return false;
  }
}
  
// get user info from supabase
async function getDatabaseUser(session : Session, supabase : any) {

  let userInfo

  // user exists? No -> add user
  const userInDB = await isUserInDB(session, supabase)
  if(!userInDB) {
    console.log('Adding new user...')
   return await insertUser(session, supabase)
  }
  // else get user info
  return await getDBUserInfo(session, supabase)
}

function getTokenCount(dbUserInfo: DbUser[]) {

}

async function FeedPage() {

  // Create Supabase client and query events
  const supabase = await createClient();
  let { data: events, error } = await supabase.from("events").select();
  console.log("Events:", events, "Error:", error);
  events = events as dbEvent[]

  // filter events
  const currentEvents = filterCurrentEvents(events)
  const upcomingEvents = filterUpcomingEvents(events)
  const pastEvents = filterPastEvents(events)

  // get auth0 session
  const session = await getSession();
  let dbUserInfo = []

  if (session?.user) { // get user from db
    console.log('session ============')
    dbUserInfo = await getDatabaseUser(session, supabase)

    console.log('db user info')
    console.log(dbUserInfo)

    // remove user info test
    // const { error } = await supabase
    // .from('users')
    // .delete()
    // .eq('sid', 'oUWNDhRKILBXNA2ZRvNZ97QY_2YDJt1S');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow p-6">
        
          {session ? (
            <div style={{justifyContent: 'end', alignItems:'center'}} className="flex">
                <div style={{justifyContent: 'end', alignItems:'center', border: '1px solid black', borderRadius: '5px', marginRight: '0.5rem', padding: '0.25rem'}} className="flex">
                    <p style={{fontSize:'14px'}}> { dbUserInfo[0]?.tokens ?? 100 } </p>
                    <img src="/coin.svg" alt="Edit" style={{height:'1.5rem'}} />
                </div>
                <ProfileImage />
            </div>
          ) : (
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Please login to bet credits
            </h2>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Feed
          </h1>
          <p className="text-gray-600 mb-4">
            Welcome to PnB Betting
          </p>

          {currentEvents.length > 0 ? (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Happening Now
            </h2>
              <ul className="space-y-2">
                {currentEvents.map((event) => (
                  <FeedItem key={event.id} event={event} canBet={false} />
                ))}
              </ul>
          </div>):( <></> )}

          {upcomingEvents.length > 0 ? (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Upcoming Fights
            </h2>
              <ul className="space-y-2">
                {upcomingEvents.map((event) => (
                  <FeedItem key={event.id} event={event} canBet={true} />
                ))}
              </ul>
          </div>):( <></> )}

          {pastEvents.length > 0 ? (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Past Events
            </h2>
              <ul className="space-y-2">
                {pastEvents.map((event) => (
                  <FeedItem key={event.id} event={event} canBet={false}/>
                ))}
              </ul>
          </div>):( <></> )}
        </div>
      </div>
    </div>
  )
}
export default FeedPage;