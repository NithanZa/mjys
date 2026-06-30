import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const gone = () =>
    NextResponse.json({ error: "This endpoint has been removed." }, { status: 410 });

export const GET = gone;
export const POST = gone;
export const PATCH = gone;
export const PUT = gone;
export const DELETE = gone;
