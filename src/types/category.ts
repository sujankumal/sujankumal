import { Post } from "@prisma/client";

export interface CatergoryType {
    id:number,
    name:String,
    posts?:Post,
}