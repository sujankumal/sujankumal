import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {
  return NextResponse.json('Namaste!');
}

// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
// 