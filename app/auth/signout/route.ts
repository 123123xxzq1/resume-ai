import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/", url.origin), { status: 303 });
}
