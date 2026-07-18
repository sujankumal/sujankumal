import { NextResponse } from "next/server";
import { scanImages } from "@/lib/image-scanner";

export async function GET() {
    try {
        const images = await scanImages();

        return NextResponse.json(images);
    } catch (err) {

        return NextResponse.json(
            { error: "Unable to scan images" },
            { status: 500 }
        );
    }
}