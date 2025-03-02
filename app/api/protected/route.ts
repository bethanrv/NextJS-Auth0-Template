import { isUserAdmin } from "@/actions/isUserAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const isAdmin = await isUserAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    protected:
      "BOOM You found my secret! - The restricted area is only for admins",
  });
}