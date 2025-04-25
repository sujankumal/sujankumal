import type { NextAuthConfig } from "next-auth";
import CredentialProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import {z} from 'zod';
import bcrypt from 'bcrypt';

import prisma from './prisma/prisma';
import { PrismaAdapter } from "@auth/prisma-adapter";

type User_type = {
  id:string,
  name:string|null,
  email:string|null,
  password:string|null,
}

async function getUser(email:string):Promise<User_type|null>{
  try{
    let user = await prisma.user.findUnique({
      where:{
        email:email,
      },
      select:{
        id:true,
        name:true,
        email:true,
        password:true,
      }
    });
    if (!user) return null;

    return {
      id:user.id.toString(),
      name:user.name,
      email:user.email,
      password:user.password,
    }; 
  }catch(error){
    // console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const authConfig = {
    pages:{
        signIn:'/log-in',
    },

    providers:[
      CredentialProvider({
        name:"Credentials",
        credentials:{
          email:{label:"Email", type:"email", placeholder:"example@sujankumal.com.np"},
          password:{label:"Password", type:"password"}
        },
        async authorize(credentials){
          // console.log("Credientials log authorize method: ", credentials);
          const parsedCredentials = z
              .object({ 
                  email: z.string().email(), 
                  password: z.string().min(8) 
              })
              .safeParse(credentials);

          if (parsedCredentials.success){
            const {email, password} = parsedCredentials.data;
            const user = await getUser(email);
            if (!user) return null;
            const passwordMatch = await bcrypt.compare(password, user.password??'.');
            // if (passwordMatch) return user;
            if (passwordMatch){
              return user;
            }
          }
          // console.log('Invalid credentials');
          return null;
        },
      }),
      GoogleProvider({
        clientId:process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
            params: {
              // prompt: "consent",
              // access_type: "offline",
              // response_type: "code"
              scope:"email profile",
            }
        },
        profile(profile){
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
          }
        }
      }),
    ],
    adapter:PrismaAdapter(prisma as any),
} satisfies NextAuthConfig;

export default authConfig;