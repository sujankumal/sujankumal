import { PostType } from "./post";

export interface ContentType {
    id:number,
    type:string,
    content:string,
    sequence:number,
    posts: PostType,
}