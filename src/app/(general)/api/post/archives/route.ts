import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest) {

    try {
        const posts = await prisma.post.findMany({
            distinct: ['year', 'month'],
            select: {
                date: true,
                month: true,
                year: true,
            },
            orderBy: [{
                year: 'asc',
            },
            {
                month: 'asc',
            },
            ]
        });
        return NextResponse.json(posts);
    } catch (error: any) {
        throw error;
    }
}

// export const revalidate = 86400;
