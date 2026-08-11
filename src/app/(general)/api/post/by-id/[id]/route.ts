import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../prisma/prisma";
import { fetchPostCountIdArray } from "@/services/data_access";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const id = Number.parseInt((await context.params).id);
    try {
        const site = await prisma.post.findUnique(
            {
                where: {
                    id: id,
                },
                include: {
                    categories: {
                        select: {
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    author: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    content: true,
                }
            }
        );
        return NextResponse.json(site);
    } catch (error) {
        throw error;
    }
}



// export const dynamicParams = true // true | false,
// export const revalidate = 10

export async function generateStaticParams() {

    const possibleValues = await fetchPostCountIdArray().then((data) => {
        return data.map((item) => {
            return item.id;
        });
    });

    const paths = possibleValues.map((value) => ({
        id: value.toString(),
    }));
    return paths;
}