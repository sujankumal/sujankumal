import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { fetchCategoryCountIdArray, fetchCategoryNameArray } from "@/services/data_access";

export async function GET(request: NextRequest, context: { params: Promise<{ name: string }> }) {
    const params = await context.params;
    const name = params.name;
    try {
        const site = await prisma.category.findFirst(
            {
                where: {
                    name: {
                        equals: name,
                        mode: 'insensitive', // Ignore case sensitivity
                    },
                },
            }
        );
        return NextResponse.json(site);
    } catch (error) {
        throw error;
    }
}



export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter

    const possibleValues = await fetchCategoryNameArray().then((data) => {
        return data.map((item) => {
            return item.name;
        });
    }); // Adjust based on your data

    // Generate an array of objects with the correct structure for static generation
    const paths = possibleValues.map((value) => ({
        name: value.toString(),
    }));
    return paths;
}