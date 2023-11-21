import { API_BASE_URL } from "@/constants/config";
import { CatergoryType } from "@/types/category";
import { PostType } from "@/types/post";
import { SiteType } from "@/types/site";
import { SocialType } from "@/types/social";
import path from "path";

const dataDirectory = path.join(process.cwd(), 'data'); // Path to your JSON data files

export async function readJsonFile(url: URL): Promise<Array<PostType>> {
    const response = await fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch((error) => {
            // console.log('Error fetching data:', error);
        });
    return response
}
export async function isServerApiResponding() {
    return await fetch(API_BASE_URL+"/api/check").then(() => {
        return true;
    })
    .catch((error) => {
        // console.log("Error: ", error);
        return false;
    });
}

export async function fetchSite(): Promise<Array<SiteType>> {
    return await isServerApiResponding().then((value) =>{
        if (value){
            return fetch(API_BASE_URL+"/api/site",{
                    method:"GET",
                    credentials:"same-origin",
                    next:{
                        revalidate: 10,
                    }
                }).then((response)=>{
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                }).catch((error)=>{
                    // console.log(error);
                    return [];
            });
        }else{
            // json
            return []
        }
    })
}

export async function fetchPostTitle():Promise<Array<PostType>>{
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/title",{
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchCategories():Promise<Array<CatergoryType>>{
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/categories",{
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}


export async function fetchPostHome():Promise<Array<PostType>>{
    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/home",{
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchAbout():Promise<Array<PostType>>{
    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/about",{
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchTwitter():Promise<Array<SocialType>>{
    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/social/twitter",{
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchArticles():Promise<Array<PostType>>{
    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/article",{
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchJokes():Promise<Array<PostType>>{
    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/joke",{
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchJokeByID(id:number):Promise<PostType>{
    console.log("Hello JOKER");
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/joke/by-id/"+id, {
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}



export async function fetchJokeCountIdArray():Promise<Array<{id:number}>>{    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/joke/count/", {
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchPostByID(id:number):Promise<PostType>{
    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/by-id/"+id, {
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchPostCountIdArray():Promise<Array<{id:number}>>{    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/count/", {
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchCategoryCountIdArray():Promise<Array<{id:number}>>{    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/categories/count/", {
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchPostsByCategoryID(id:number):Promise<Array<PostType>>{
    
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/post/category/"+id, {
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}


export async function fetchSocial():Promise<Array<SocialType>> {
    return await isServerApiResponding().then((value)=>{
        if (value){
            return fetch(API_BASE_URL+"/api/social/",{
                method:"GET",
                credentials:"same-origin",
                next:{
                    revalidate: 10,
                }
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).catch((error)=>{
                // console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}
