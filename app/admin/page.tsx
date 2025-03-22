// pages/admin/page.tsx (or wherever your admin page lives)
import { isUserAdmin } from "@/actions/isUserAdmin";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EventItem from "./EventItem"; // Adjust the import path as necessary

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


async function AdminPage() {
  const isAdmin = await isUserAdmin();

  if (!isAdmin) {
    return redirect("/unauthorized");
  }

  // Create Supabase client and query events
  const supabase = await createClient();
  let { data: fights, error } = await supabase.from("fights").select().order('date', {ascending : true});
  console.log("Fights:", fights, "Error:", error);

  fights = fights as Fight[]

  // filter events
  const currentEvents = filterCurrentEvents(fights)
  const upcomingEvents = filterUpcomingEvents(fights)
  const pastEvents = filterPastEvents(fights)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            Welcome to the admin area. This page is only accessible to
            administrators.
          </p>
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Happening Now
            </h2>
            {currentEvents.length > 0 ? (
              <ul className="space-y-2">
                {currentEvents.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">
                There are no events happening right now.
              </p>
            )}
          </div>
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Upcoming Events
            </h2>
            {upcomingEvents.length > 0 ? (
              <ul className="space-y-2">
                {upcomingEvents.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">
                There are no upcoming events.
              </p>
            )}
          </div>
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Past Events
            </h2>
            {pastEvents.length > 0 ? (
              <ul className="space-y-2">
                {pastEvents.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">
                There are no completed events.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
