import { NextResponse } from "next/server";
import { scanImages } from "@/lib/image-scanner";
import { requireVerifiedUser } from "@/services/authorization";

export async function GET() {
    const authorization = await requireVerifiedUser();
    if (authorization.response) return authorization.response;

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