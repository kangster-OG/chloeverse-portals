import { NextResponse } from "next/server";

const DEFAULT_WAITLIST_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxOP0JpamQ_26ZKOL1wnE939tImNZm1iewK85ZyKbgWW_RmP27LELvjQVtPxnsUKET3HQ/exec";

type WaitlistRequest = {
  email?: string;
  source?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const appsScriptUrl = process.env.WAITLIST_APPS_SCRIPT_URL || DEFAULT_WAITLIST_APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    return NextResponse.json(
      {
        error: "Waitlist forwarding is not configured yet.",
      },
      { status: 503 },
    );
  }

  let payload: WaitlistRequest;

  try {
    payload = (await request.json()) as WaitlistRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = payload.email?.trim() ?? "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        source: payload.source ?? "startup",
        submittedAt: new Date().toISOString(),
      }),
      cache: "no-store",
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json({ error: "Waitlist forwarding failed upstream." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to reach the waitlist service." }, { status: 502 });
  }
}
