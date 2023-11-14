import { Post } from "@prisma/client";

export interface ContentType {
    id:number,
    type:String,
    content:String,
    sequence:number,
    posts: Post,
}