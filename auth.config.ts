import type { NextAuthConfig } from "next-auth";
import CredentialProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { z } from 'zod';
import bcrypt from 'bcrypt';

import prisma from './prisma/prisma';
import { PrismaAdapter } from "@auth/prisma-adapter";

type User_type = {
  id: string,
  name: string | null,
  email: string | null,
  password: string | null,
  verified: boolean,
  image?: string | null,
}

async function getUser(email: string): Promise<User_type | null> {
  try {
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        verified: true,
        image: true,
      }
    });
    if (!user) return null;
    // Debug: log user object
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      verified: user.verified,
      image: user.image,
    };
  } catch (error) {
    throw new Error('Failed to fetch user.');
  }
}

export const authConfig = {
  pages: {
    signIn: '/log-in',
  },
  providers: [
    CredentialProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@sujankumal.com.np" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.email(),
            password: z.string().min(8)
          })
          .safeParse(credentials);
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          // console.log('authorize user:', user);
          if (!user) return null;
          const passwordMatch = await bcrypt.compare(password, user.password ?? '.');
          if (passwordMatch) {
            return user;
          }
        }
        return null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "email profile",
        }
      },
      profile(profile) {
        // You may want to fetch verified from DB if needed for Google users
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      }
    }),
  ],
  adapter: PrismaAdapter(prisma as any),
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      // console.log('JWT callback user:', user);
      // console.log('JWT callback token:', token);
      if (user && typeof user.verified !== "undefined") {
        token.verified = user.verified;
      }
      return token;
    },
    async session({ session, user }) {
      if (session?.user && user?.verified !== undefined) {
        session.user.verified = user.verified;
      }
      return session;
    }
  },
} satisfies NextAuthConfig;

export default authConfig;