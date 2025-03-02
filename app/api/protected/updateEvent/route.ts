import { isUserAdmin } from "@/actions/isUserAdmin";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  // Check admin access
  const isAdmin = await isUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the incoming JSON request
    const { id, home_team, away_team } = await request.json();

    // Create a Supabase client instance
    const supabase =  await createClient();
    // Update the event where the id matches
    const { data, error } = await supabase
      .from("events")
      .update({ home_team, away_team })
      .eq("id", id)
      .select(); // Returns the updated record(s)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
