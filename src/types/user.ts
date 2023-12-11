import { PostType } from "./post";

export interface UserType {
    id:number,
    name:String,
    email:String,
    createdAt:Date,
    updatedAt:Date,
    posts: PostType,
}

export interface UserProfileType {
    id:number,
    author:UserType,
    status:string,
    image:string,
    about:string,
    phone:string,
    email:string,
}