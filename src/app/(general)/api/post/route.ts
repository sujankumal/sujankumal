
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";

export async function GET(request: NextRequest) {
    const site = await prisma.post.findMany();
    return NextResponse.json(site);
}

// export const revalidate = 86400;
