import { API_BASE_URL } from "@/constants/config";
import { CatergoryType } from "@/types/category";
import { PostType } from "@/types/post";
import { SiteType } from "@/types/site";
import { SocialType } from "@/types/social";
import { notFound } from "next/navigation";
import path from "path";

const dataDirectory = path.join(process.cwd(), 'data'); // Path to your JSON data files

export async function readJsonFile(url: URL): Promise<Array<PostType>> {
    try {
        const response = await fetch(url)
            .then((response) => {
                if (!response.ok) {
                    notFound();
                }
                return response.json();
            });
        return response;
    } catch (error) {
        notFound();
    }
}

export async function isServerApiResponding() {
    return await fetch(API_BASE_URL + "/api/check").then(() => {
        return true;
    });
}

export async function fetchSite(): Promise<Array<SiteType>> {
    try {
        return fetch(API_BASE_URL + "/api/site", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchPostTitle(): Promise<Array<PostType>> {
    try {
        return fetch(API_BASE_URL + "/api/post/title", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}


export async function fetchArchivesDates(): Promise<Array<PostType>> {
    try {
        return fetch(API_BASE_URL + "/api/post/archives", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchArchivesByYearAndMonth(year: number, month: number): Promise<Array<PostType>> {
    try {
        return fetch(API_BASE_URL + "/api/post/archives/" + year + '/' + month, {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}


export async function fetchCategories(): Promise<Array<CatergoryType>> {
    try {
        return fetch(API_BASE_URL + "/api/categories", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}


export async function fetchPostHome(): Promise<Array<PostType>> {

    try {
        return fetch(API_BASE_URL + "/api/post/home", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchAbout(): Promise<Array<PostType>> {

    try {
        return fetch(API_BASE_URL + "/api/post/about", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchTwitter(): Promise<Array<SocialType>> {

    try {
        return fetch(API_BASE_URL + "/api/social/twitter", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchArticles(): Promise<Array<PostType>> {

    try {
        return fetch(API_BASE_URL + "/api/post/article", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchJokes(): Promise<Array<PostType>> {

    try {
        return fetch(API_BASE_URL + "/api/post/joke", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchJokeByID(id: number): Promise<PostType> {
    console.log("Hello JOKER");
    try {
        return fetch(API_BASE_URL + "/api/post/joke/by-id/" + id, {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}



export async function fetchJokeCountIdArray(): Promise<Array<{ id: number }>> {
    try {
        return fetch(API_BASE_URL + "/api/post/joke/count/", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchPostByID(id: number): Promise<PostType> {
    try {
        return fetch(API_BASE_URL + "/api/post/by-id/" + id, {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchPostCountIdArray(): Promise<Array<{ id: number }>> {
    try {
        return fetch(API_BASE_URL + "/api/post/count/", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchCategoryCountIdArray(): Promise<Array<{ id: number }>> {
    try {
        return fetch(API_BASE_URL + "/api/categories/count/", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchPostCountYearMonthArray(): Promise<Array<{ year: number, month:number }>> {
    try {
        return fetch(API_BASE_URL + "/api/post/count/year-month", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}

export async function fetchPostsByCategoryID(id: number): Promise<Array<PostType>> {
    try {
        return fetch(API_BASE_URL + "/api/post/category/" + id, {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}


export async function fetchSocial(): Promise<Array<SocialType>> {
    try {
        return fetch(API_BASE_URL + "/api/social/", {
            method: "GET",
            credentials: "same-origin",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                notFound();
            }
            return response.json();
        });
    } catch (error) {
        notFound();
    }
}
