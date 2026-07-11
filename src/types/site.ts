export interface SiteType {
    id:number,
    header_image:string,
    header_image_credit:string,
    title:string,
    name:string,
    motto:string,
    greeting:string,
    description:string,
    detail:string,
    copyright:string,
    year:number,
    privacy_policy?: string | null,
    contact_email?: string | null,
    contact_phone?: string | null
}