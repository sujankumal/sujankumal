import { API_BASE_URL } from "@/constants/constants";
import { CatergoryType } from "@/types/category";
import { PostTitleType, PostType } from "@/types/post";
import { SiteType } from "@/types/site";
import { SocialType } from "@/types/social";
import { notFound } from "next/navigation";
import path from "path";
import prisma from "../../prisma/prisma";
import { UpdateType } from "@/types/update";
import { ProjectType } from "@/types/project";

const dataDirectory = path.join(process.cwd(), 'data'); // Path to your JSON data files

export function isExternalFetchSet(): Boolean {
    // Be carefull here
    return (API_BASE_URL === '') ? false : true;
}

export async function _csrfToken():Promise<string>{
    try {
      return await fetch(API_BASE_URL+'/api/auth/csrf',{
        method: "GET",
        next: {
            revalidate: 10,
        }
      }).then((res)=>{
        return res.json()
      }).then((data)=>{
        return data.csrfToken??''
      })
    }catch(error){
      return '';
    }
  } 
  
export async function fetchSite():Promise<SiteType> {
    try {
        if (!isExternalFetchSet()) {
            // data
            // to do
            const site = prisma.site.findFirst({
                orderBy:{
                    id:'desc'
                }
            });
            return site.then();
        }    
        return fetch(API_BASE_URL + "/api/site", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}
export async function fetchSitePrivacyPolicy():Promise<{privacy_policy:string}>{
    try {
        if (!isExternalFetchSet()) {
            // data
            const site = prisma.site.findFirst({
                orderBy:{
                    id:'desc'
                },
                select:{
                    privacy_policy:true
                }
            });
            return site.then();
        }
        return fetch(API_BASE_URL + "/api/site/privacy-policy", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    }catch(error){
        throw error;
    }
}
export async function fetchProjects():Promise<ProjectType[]>{
    try {
        if (!isExternalFetchSet()) {
            // data
            const site = prisma.project.findMany({
                orderBy:{
                    title:'asc'
                },
            });
            return site.then();
        }
        return fetch(API_BASE_URL + "/api/project/", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    }catch(error){
        throw error;
    }
}
export async function fetchPostTitle(): Promise<Array<PostTitleType>> {
    try {
        if (!isExternalFetchSet()) {
            // data
            const posts = await prisma.post.findMany(
                {
                    select:{
                        id: true,
                        title: true,
                    },
                    orderBy:{
                        date:'desc',
                    }
                }
            );
            return posts;
        }
        return fetch(API_BASE_URL + "/api/post/title", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}


export async function fetchPostTitleTicker(): Promise<Array<PostTitleType>> {
    try {
        if (!isExternalFetchSet()) {
            // data
            const posts = await prisma.post.findMany(
                {
                    select:{
                        id: true,
                        title: true,
                    },
                    orderBy:{
                        date:'desc',
                    },
                    take:5,
                }
            );
            return posts;
        }
        return fetch(API_BASE_URL + "/api/post/title-ticker", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}
export async function fetchArchivesDates(): Promise<Array<PostType>> {
    try {
        if (!isExternalFetchSet()) {
            // data 
            const posts = prisma.post.findMany({
                distinct:['year','month'],
                select:{
                    date:true,
                    month:true,
                    year:true,
                },
                orderBy:[{
                        year:'asc',
                    },
                    {
                        month:'asc',
                },
                ]
            });
            return posts.then();    
        }    
        return fetch(API_BASE_URL + "/api/post/archives", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchArchivesByYearAndMonth(year: number, month: number): Promise<Array<PostType>> {
    try {
        if (!isExternalFetchSet()) {
            // data 
            const posts = prisma.post.findMany({
                where:{
                    AND:{
                        year: Number(year),
                        month: Number(month)
                    }
                },
                select:{
                    id: true,
                    title: true,
                    description:true,
                    date:true,
                    published:true,
                    categories:{
                        select:{
                            category:{
                                select:{
                                    id:true,
                                    name:true,
                                },
                            },
                        }
                    },
                    author:{
                        select:{
                            id:true,
                            name:true,
                        }
                    },
                }            
            });
            return posts.then();
        }    
        return fetch(API_BASE_URL + "/api/post/archives/" + year + '/' + month, {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}


export async function fetchCategories(): Promise<Array<CatergoryType>> {
    try {
        if (!isExternalFetchSet()) {
            // data 
            const site = await prisma.category.findMany({
                orderBy:{
                    name:'asc'
                },
            });
            return site;
        }    
        return fetch(API_BASE_URL + "/api/categories", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}


export async function fetchPostHome(): Promise<Array<PostType>> {

    try {
        if (!isExternalFetchSet()) {
            // data 
                const posts = prisma.post.findMany(
                    {
                        where:{
                            categories:{
                                some:{
                                    category:{    
                                        name:{
                                            equals:'index',
                                            mode:'insensitive',
                                        },
                                    }
                                },
                            },
                        },
                        orderBy:{
                            id:'desc'
                        },
                        select:{
                            id:true,
                            title: true,
                            description:true,
                            date:true,
                            published:true,
                            categories:{
                                select:{
                                    category:{
                                        select:{
                                            id:true,
                                            name:true,
                                        },
                                    },
                                },
                            },
                            author:{
                                select:{
                                    id:true,
                                    name:true,
                                }
                            },
                        }
                    }
                );
            return posts.then();
        }    
        return fetch(API_BASE_URL + "/api/post/home", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchAbout(): Promise<Array<PostType>> {

    try {
        if (!isExternalFetchSet()) {
            // data 
            const posts = prisma.post.findMany(
                {
                    where:{
                        categories:{
                            some:{
                                category:{
                                    name:{
                                        equals:'about',
                                        mode:'insensitive',
                                    }
                                },
                            },
                        },
                    },
                    orderBy:{
                        id:'desc'
                    },
                    take:1,
                    select:{
                        content:true,
                        main_image:true,
                        main_image_credit:true,
                    }
                }
            );
            return posts.then();
        }    
        return fetch(API_BASE_URL + "/api/post/about", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchTwitter(): Promise<Array<SocialType>> {

    try {
        if (!isExternalFetchSet()) {
            // data 
            const site = prisma.social.findMany(
                {
                    where:{
                        name:{
                            equals:'twitter',
                            mode:'insensitive',
                        },
                    },
                    select:{
                        embed:true,
                        username:true
                    },
                }
            );
            return site.then();
        }    
        return fetch(API_BASE_URL + "/api/social/twitter", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchArticles(): Promise<Array<PostType>> {

    try {
        if (!isExternalFetchSet()) {
            // data 
            const posts = prisma.post.findMany(
                {
                    select:{
                        id: true,
                        title: true,
                        description:true,
                        date:true,
                        published:true,
                        categories:{
                            select:{
                                category:{
                                    select:{
                                        id:true,
                                        name:true,
                                    },
                                },
                            }
                        },
                        author:{
                            select:{
                                id:true,
                                name:true,
                            }
                        },
                    },
                    orderBy:{
                        id:'desc'
                    },
                }
            );
            return posts.then();
        }    
        return fetch(API_BASE_URL + "/api/post/article", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchJokes(): Promise<Array<PostType>> {

    try {
        if (!isExternalFetchSet()) {
            // data 
            const posts = prisma.post.findMany(
                {
                    where:{
                        categories:{
                            some:{
                                category:{
                                    name:{
                                        equals:'joke',
                                        mode:'insensitive',
                                    },
                                },
                            },
                        },
                    },
                    select:{
                        id: true,
                        title: true,
                        description:true,
                        date:true,
                        published:true,
                        categories:{
                            select:{
                                category:{
                                    select:{
                                        id:true,
                                        name:true
                                    },  
                                },
                            },
                        },
                        author:{
                            select:{
                                id:true,
                                name:true,
                            }
                        },
                    }
                }
            );
            return posts.then();
        }    
        return fetch(API_BASE_URL + "/api/post/joke", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchJokeByID(id: number): Promise<PostType> {
    // console.log("Hello JOKER");
    try {
        if (!isExternalFetchSet()) {
            // data 

            const joke = prisma.post.findUnique(
                {
                    where:{
                        id: Number(id),
                    },
                    include:{
                        categories:{
                            include:{
                                category:{
                                    select:{
                                        id:true,
                                        name:true,
                                    },
                                },
                            },
                        },
                        author:{
                            select:{
                                id:true,
                                name:true,
                            }
                        },
                        content:true,
                    }
                }
            );
            return joke.then();
        }    
        return fetch(API_BASE_URL + "/api/post/joke/by-id/" + id, {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}



export async function fetchJokeCountIdArray(): Promise<Array<{ id: number }>> {
    try {
        if (!isExternalFetchSet()) {

            const posts = await prisma.post.findMany(
                {
                    select: {
                        id: true
                    },
                    where: {
                        categories: {
                            some: {
                                category: {
                                    name: {
                                        equals: 'joke',
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                    }
                }
            );
            return posts;
        }
        return fetch(API_BASE_URL + "/api/post/joke/count/", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchPostByID(id: number): Promise<PostType> {
    try {
        if (!isExternalFetchSet()) {
            // data 
            const post = prisma.post.findUnique(
                {
                    where:{
                        id: Number(id),
                    },
                    include:{
                        categories:{
                            select:{
                                category:{
                                    select:{
                                        id:true,
                                        name:true,
                                    },
                                },
                            },
                        },
                        author:{
                            select:{
                                id:true,
                                name:true,
                            }
                        },
                        content:true,
                    }
                }
            );
            return post.then();
        }    
        return fetch(API_BASE_URL + "/api/post/by-id/" + id, {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchPostCountIdArray(): Promise<Array<{ id: number }>> {
    try {
        if (!isExternalFetchSet()) {
            const posts = await prisma.post.findMany(
                {
                    select: {
                        id: true
                    }
                }
            );
            return posts;
        }
        return fetch(API_BASE_URL + "/api/post/count/", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchCategoryCountIdArray(): Promise<Array<{ id: number }>> {
    try {
        if (!isExternalFetchSet()) {
            const posts = await prisma.category.findMany(
                {
                    select: {
                        id: true
                    }
                }
            );
            return posts;
        }
        return fetch(API_BASE_URL + "/api/categories/count/", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchCategoryById(id: number): Promise<CatergoryType> {
    try {
        if (!isExternalFetchSet()) {
            const category = prisma.category.findUnique(
                {
                    where: {
                        id: Number(id)
                    }
                }
            );
            return category.then();
        }
        return fetch(API_BASE_URL + "/api/category/"+id, {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchPostCountYearMonthArray(): Promise<Array<{ year: number, month: number }>> {
    try {
        if (!isExternalFetchSet()) {
            const posts = prisma.post.findMany(
                {
                    select: {
                        year: true,
                        month: true,
                    },
                    orderBy:{
                        id:'desc'
                    },
                }
            )
            return posts.then();
        } else {
            return fetch(API_BASE_URL + "/api/post/count/year-month", {
                method: "GET",
                credentials: "same-origin",
                next: {
                    revalidate: 10,
                }
            }).then((response) => {
                if (!response.ok) {
                    throw new Error('Not found');
                }
                return response.json();
            });
        }
    } catch (error) {
        throw error;
    }
}

export async function fetchPostsByCategoryID(id: number): Promise<Array<PostType>> {
    try {
        if (!isExternalFetchSet()) {
            // data 
            const post = prisma.post.findMany(
                {
                    where:{
                        categories:{
                            some:{
                                category:{
                                    id: Number(id),
                                },
                            },
                        },
                    },
                    select:{
                        id: true,
                        title: true,
                        description:true,
                        date:true,
                        published:true,
                        categories:{
                            select:{
                                category:{
                                    select:{
                                        id:true,
                                        name:true,
                                    },
                                },
                            }
                        },
                        author:{
                            select:{
                                id:true,
                                name:true,
                            }
                        },
                    },
                    orderBy:{
                        date:'desc'
                    },
                }
            );
            return post.then();
        }    
        return fetch(API_BASE_URL + "/api/post/category/" + id, {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}


export async function fetchSocial(): Promise<Array<SocialType>> {
    try {
        if (!isExternalFetchSet()) {
            const social = await prisma.social.findMany();
            return social;
        }

        return fetch(API_BASE_URL + "/api/social/", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}


export async function fetchTechPosts(): Promise<Array<PostType>> {

    try {
        if (!isExternalFetchSet()) {
            // data 
            const posts = prisma.post.findMany(
                {
                    where:{
                        categories:{
                            some:{
                                category:{
                                    name:{
                                        equals:'tech',
                                        mode:'insensitive',
                                    },
                                },
                            },
                        },
                    },
                    orderBy:{
                        id:'desc'
                    },
                    select:{
                        id: true,
                        title: true,
                        description:true,
                        date:true,
                        published:true,
                        categories:{
                            select:{
                                category:{
                                    select:{
                                        id:true,
                                        name:true
                                    },  
                                },
                            },
                        },
                        author:{
                            select:{
                                id:true,
                                name:true,
                            }
                        },
                    }
                }
            );
            return posts.then();
        }    
        return fetch(API_BASE_URL + "/api/post/tech", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchTechPostByID(id: number): Promise<PostType> {
    
    try {
        if (!isExternalFetchSet()) {
            // data 

            const joke = prisma.post.findUnique(
                {
                    where:{
                        id: Number(id),
                    },
                    include:{
                        categories:{
                            include:{
                                category:{
                                    select:{
                                        id:true,
                                        name:true,
                                    },
                                },
                            },
                        },
                        author:{
                            select:{
                                id:true,
                                name:true,
                            }
                        },
                        content:true,
                    }
                }
            );
            return joke.then();
        }    
        return fetch(API_BASE_URL + "/api/post/tech/by-id/" + id, {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}



export async function fetchTechPostCountIdArray(): Promise<Array<{ id: number }>> {
    try {
        if (!isExternalFetchSet()) {

            const posts = await prisma.post.findMany(
                {
                    select: {
                        id: true
                    },
                    where: {
                        categories: {
                            some: {
                                category: {
                                    name: {
                                        equals: 'tech',
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                    }
                }
            );
            return posts;
        }
        return fetch(API_BASE_URL + "/api/post/tech/count/", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchUpdates(): Promise<Array<UpdateType>> {
    try {
        if (!isExternalFetchSet()) {
            const updates = prisma.updates.findMany(
                {
                    orderBy:{
                        id:'desc',
                    }
                }
            );
            return updates.then();
        }
        return fetch(API_BASE_URL + "/api/post/tech/count/", {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Not found');
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}
