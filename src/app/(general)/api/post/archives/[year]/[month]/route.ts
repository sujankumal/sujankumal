import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../../prisma/prisma";
import { fetchPostCountYearMonthArray } from "@/services/data_access";

export async function GET(request: NextRequest, context: { params: Promise<{ year: string, month: string }> }) {
    const year = Number.parseInt((await context.params).year);
    const month = Number.parseInt((await context.params).month);
    try {
        const posts = await prisma.post.findMany({
            where: {
                AND: {
                    year: year,
                    month: month
                }
            },
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
                published: true,
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    }
                },
                author: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
            }
        });
        return NextResponse.json(posts);
    } catch (exception: unknown) {
        return NextResponse.json([]);
    }
}




// export const dynamicParams = true // true | false,
// export const revalidate = 10

export async function generateStaticParams() {

    const year_month = await fetchPostCountYearMonthArray();

    const paths = year_month.map((value) => ({
        year: value.year.toString(),
        month: value.month.toString(),
    }));
    return paths;
}