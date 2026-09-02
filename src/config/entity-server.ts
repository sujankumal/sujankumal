'use server';

import 'server-only'; // Ensures this never leaks to the client
import prisma from "../../prisma/prisma";
import bcrypt from "bcrypt";
import { checkPwnedPassword } from "@/services/pwned";

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
    securitylogs: "securityLog",
};

const serverConfigs = {
    users: {
        beforeCreate: async (data: any) => {
            if (data.password) {
                const pwned = await checkPwnedPassword(data.password);
                if (pwned.isPwned) {
                    throw new Error(`This password was found in ${pwned.breachesCount} public data breaches. Please choose a more secure password.`);
                }
                data.password = await bcrypt.hash(data.password, 12);
            }
            return data;
        },

        beforeUpdate: async (data: any) => {
            if (data.password) {
                const pwned = await checkPwnedPassword(data.password);
                if (pwned.isPwned) {
                    throw new Error(`This password was found in ${pwned.breachesCount} public data breaches. Please choose a more secure password.`);
                }
                data.password = await bcrypt.hash(data.password, 12);
            } else {
                delete data.password;
            }
            return data;
        },
        afterRead: async (data: any) => {
            const users = data.map((user: any) => {
                if (user.password) delete user.password;
                if (user.twoFactorSecret) delete user.twoFactorSecret;
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