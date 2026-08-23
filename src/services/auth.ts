import NextAuth, { type DefaultSession } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { z } from 'zod';
import bcrypt from 'bcrypt';

import prisma from '../../prisma/prisma';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from '../../auth.config';


type UserType = {
  id: string;
  name: string | null;
  email: string | null;
  password: string | null;
  verified: boolean;
  image?: string | null;
};

async function getUser(email: string): Promise<UserType | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        verified: true,
        image: true,
      },
    });
    if (!user) return null;
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      verified: user.verified,
      image: user.image,
    };
  } catch {
    throw new Error('Failed to fetch user.');
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma as any),
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@sujankumal.com.np" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(8),
          })
          .safeParse(credentials);
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);

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
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified ?? false;
      }
      return true;
    },
  },
});

