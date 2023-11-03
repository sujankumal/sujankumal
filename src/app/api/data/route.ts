
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest){
    console.log("Hello I am server data api get metheod:");
    return NextResponse.json({data:true})
}    

export async function POST(request: NextRequest) {
    const {table, col, op, val} = await request.json();
    if ( col && op && val){
        const data = await prisma.$queryRaw(
            Prisma.raw(`SELECT * FROM ${table} WHERE ${col} ${op} ${val};`)
        );
        return NextResponse.json(data)
    }
    const data = await prisma.$queryRaw(
        Prisma.raw(`SELECT * FROM ${table}`)
    );
    return NextResponse.json(data)
}