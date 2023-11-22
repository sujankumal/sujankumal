import { CategoriesOnPosts } from "./category-post";
import { UserType } from "./user";
import { ContentType } from "./content";

export interface PostType{
    id:number,
    title:string,
    description:string,
    content:Array<ContentType>,
    main_image:string,
    main_image_credit?:string,
    date:Date,
    year:number,
    month:number,
    categories:Array<CategoriesOnPosts>,
    published:Boolean,
    author:UserType,
}