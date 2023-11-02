export interface PostType{
    id:number,
    title:string,
    description:string,
    url:string,
    main_image:string,
    main_image_credit?:string,
    date:string,
    content:Array<Object>,
    comment:Array<string>,
    categories:Array<number>,
    author:string,
}