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

// Return past events
function filterPastEvents(events: Event[]) {
  if (!events || !Array.isArray(events))
    throw new Error("events not array: " + events);
  let pastEvents: Event[] = [];
  events.forEach((event: Event) => {
    if (event.completed === "true") pastEvents.push(event);
  });
  return pastEvents;
}

// Return current events (non-complete and already commenced)
function filterCurrentEvents(events: Event[]) {
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
function filterUpcomingEvents(events: Event[]) {
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


async function AdminPage() {
  const isAdmin = await isUserAdmin();

  if (!isAdmin) {
    return redirect("/unauthorized");
  }

  // Create Supabase client and query events
  const supabase = await createClient();
  const { data: events, error } = await supabase.from("events").select();
  console.log("Events:", events, "Error:", error);

  // Assume events is an array and you have filtered them as needed.
  const currentEvents = filterCurrentEvents(events)
  const upcomingEvents = filterUpcomingEvents(events)
  const pastEvents = filterPastEvents(events)

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
