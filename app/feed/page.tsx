import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FeedItem from "./FeedItem"; // Adjust the import path as necessary
import ProfileImage from "@/components/ProfileImage";
import { getSession } from "@auth0/nextjs-auth0";


interface Event {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    completed: string;
    home_team: string;
    away_team: string;
    scores: string;
    last_updated: string;
}

// Return past events
function filterPastEvents(events: Event[]):Event[] {
    if (!events || !Array.isArray(events))
      throw new Error("events not array: " + events);
    let pastEvents: Event[] = [];
    events.forEach((event: Event) => {
      if (event.completed === "true") pastEvents.push(event);
    });
    return pastEvents;
}
  
// Return current events (non-complete and already commenced)
function filterCurrentEvents(events: Event[]):Event[] {
    if (!events || !Array.isArray(events))
      throw new Error("events not array: " + events);
    const currentTime = new Date();
    let currentEvents: Event[] = [];
    events.forEach((event: Event) => {
      if (event.completed === "false" && new Date(event.commence_time) < currentTime)
        currentEvents.push(event);
    });
    return currentEvents;
}
  
// Return upcoming events
function filterUpcomingEvents(events: Event[]):Event[] {
    if (!events || !Array.isArray(events))
      throw new Error("events not array: " + events);
    const currentTime = new Date();
    let upcomingEvents: Event[] = [];
    events.forEach((event: Event) => {
      if (event.completed === "false" && new Date(event.commence_time) > currentTime)
        upcomingEvents.push(event);
    });
    return upcomingEvents;
}
  

async function FeedPage() {

  // Create Supabase client and query events
  const supabase = await createClient();
  let { data: events, error } = await supabase.from("events").select();
  console.log("Events:", events, "Error:", error);
  events = events as Event[]

  // filter events
  const currentEvents = filterCurrentEvents(events)
  const upcomingEvents = filterUpcomingEvents(events)
  const pastEvents = filterPastEvents(events)

  // get auth0 session
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow p-6">
        
          {session ? (
            <div style={{justifyContent: 'end', alignItems:'center'}} className="flex">
                <div style={{justifyContent: 'end', alignItems:'center', border: '1px solid black', borderRadius: '5px', marginRight: '0.5rem', padding: '0.25rem'}} className="flex">
                    <p style={{fontSize:'14px'}}> 100 </p>
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
                  <FeedItem key={event.id} event={event} />
                ))}
              </ul>
          </div>):( <></> )}

          {upcomingEvents.length > 0 ? (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Upcoming Events
            </h2>
              <ul className="space-y-2">
                {upcomingEvents.map((event) => (
                  <FeedItem key={event.id} event={event} />
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
                  <FeedItem key={event.id} event={event} />
                ))}
              </ul>
          </div>):( <></> )}
        </div>
      </div>
    </div>
  )
}
export default FeedPage;