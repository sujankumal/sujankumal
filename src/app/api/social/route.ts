
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/prisma";

export async function GET(request: NextRequest){
    console.log("Hello I am server get social method");
    const social = await prisma.social.findMany();
    return NextResponse.json(social);
}