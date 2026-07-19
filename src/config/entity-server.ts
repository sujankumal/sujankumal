'use server';

import 'server-only'; // Ensures this never leaks to the client
import prisma from "../../prisma/prisma";
import bcrypt from "bcrypt";

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

const serverConfigs = {
    users: {
        beforeCreate: async (data: any) => {
            if (data.password) {
                data.password = await bcrypt.hash(data.password, 12);
            }
            return data;
        },

        beforeUpdate: async (data: any) => {
            if (data.password) {
                data.password = await bcrypt.hash(data.password, 12);
            } else {
                delete data.password;
            }
            return data;
        },
        afterRead: async (data: any) => {
            const users = data.map((user: any) => {
                if (user.password) delete user.password;
                return user;
            });
            return users;
        }
    },
};

export async function getServerConfig(entity: string) {
    return serverConfigs[entity.toLowerCase() as keyof typeof serverConfigs];
}

export async function getEntityModel(entity: string) {

    const modelKey = prismaModelMap[entity.toLowerCase()];
    if (!modelKey || !(modelKey in prisma)) {

        return null;
    }
    return (prisma as any)[modelKey];

}