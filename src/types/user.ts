import { PostType } from "./post";

export interface UserType {
    id:number,
    name:String,
    email:String,
    createdAt:Date,
    updatedAt:Date,
    posts: PostType,
}