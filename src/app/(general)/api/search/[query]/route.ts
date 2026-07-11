import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest, context: { params: Promise<{ query: string }> }) {
    try {
        const { query } = await context.params;

        if (!query || query.trim() === "") {
            return NextResponse.json([]);
        }
        const searched_data = await prisma.post.findMany(
            {
                select: {
                    id: true,
                    title: true,
                    url: true,
                },
                where: {
                    OR: [
                        {
                            title: {
                                contains: query,
                                mode: "insensitive",
                            },
                        },
                        {
                            description: {
                                contains: query,
                                mode: "insensitive",
                            },
                        },
                        {
                            content: {
                                some: {
                                    content: {
                                        contains: query,
                                        mode: "insensitive",
                                    }
                                },
                            },
                        },
                    ],
                },
            }
        );
        return NextResponse.json(searched_data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}



export const dynamicParams = true
export const revalidate = 10