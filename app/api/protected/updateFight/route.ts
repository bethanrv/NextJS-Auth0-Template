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
    const { id, fighter_1_name, fighter_2_name } = await request.json();

    // Create a Supabase client instance
    const supabase =  await createClient();
    // Update the event where the id matches
    const { data, error } = await supabase
      .from("fights")
      .update({ 
        fighter_1_name : fighter_1_name,
        fighter_2_name : fighter_2_name 
      })
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
