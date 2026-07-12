'use server';

import 'server-only'; // Ensures this never leaks to the client
import prisma from "../../prisma/prisma";

const prismaModelMap: Record<string, string> = {
    sites: "site",
    updates: "updates",
    socials: "social",
    projects: "project",
    posts: "post",
    content: "content",
    categories: "category",
    categoriesonposts: "categoriesOnPosts",
    users: "user",
    profiles: "profile",
    accounts: "account",
    sessions: "session",
    verificationtokens: "verificationToken",
};

export async function getEntityModel(entity: string) {

    const modelKey = prismaModelMap[entity.toLowerCase()];
    if (!modelKey || !(modelKey in prisma)) {
        console.error(`Prisma model matching key "${entity}" not found.`);
        return null;
    }
    return (prisma as any)[modelKey];

}