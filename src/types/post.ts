import { User } from "@prisma/client";

export interface PostType{
    id:number,
    title:string,
    description:string,
    content:Array<Object>,
    main_image:string,
    main_image_credit?:string,
    date:Date,
    categories:Array<Object>,
    published:Boolean,
    author:User,
}