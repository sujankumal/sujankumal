import { Post } from "@prisma/client";

export interface UserType {
    id:number,
    name:String,
    email:String,
    createdAt:Date,
    updatedAt:Date,
    posts: Post,
}