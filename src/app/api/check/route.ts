import { isNodeJs } from "@/services/check_node";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest){
    console.log("Hello I am server api: Check Node env",isNodeJs());
    return NextResponse.json({'value':true})
}    
