import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    return NextResponse.json({ 'value': true })
}

// export const revalidate = 86400;
