import { Category, Content, User } from "@prisma/client";

export interface PostType{
    id:number,
    title:string,
    description:string,
    content:Array<Content>,
    main_image:string,
    main_image_credit?:string,
    date:Date,
    categories:Array<Category>,
    published:Boolean,
    author:User,
}