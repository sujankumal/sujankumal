import { APP_BASE_URL } from "@/constants/config";
import { PostType } from "@/types/post";
import { SiteType } from "@/types/site";
import path from "path";

const dataDirectory = path.join(process.cwd(), 'data'); // Path to your JSON data files

export function isNodeJs() {
    if ((typeof process !== 'undefined') && process.release &&
        (process.release.name.search(/node|io.js/) !== -1)) {
        return true;
    } else {
        return false;
    }
}

export async function readJsonFile(url: URL): Promise<Array<PostType>> {
    const response = await fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch((error) => {
            console.log('Error fetching data:', error);
        });
    return response
}
export async function isServerApiResponding() {
    return await fetch(APP_BASE_URL+'/api/check').then(() => {
        return true;
    })
    .catch((error) => {
        console.log("Error: ", error);
        return false;
    });
}

export async function fetchSite(): Promise<Array<SiteType>> {
    return await isServerApiResponding().then((value) =>{
        if (value){
            return fetch(APP_BASE_URL+'/api/site',{
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
                    console.log(error);
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
            return fetch(APP_BASE_URL+'/api/post/id/title',{
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
                console.log(error);
                return [];
            });
        }else{
            // json
            return []
        }
    });
}

export async function fetchData(
    table: string,
    whereCol?: string | undefined,
    whereOpe?: string | undefined,
    whereVal?: string | undefined
): Promise<Array<PostType>> {
    
    return await isServerApiResponding().then((value) => {
        if (value) {
            console.log("Fetch Data, isnodejs");
            return fetch(APP_BASE_URL+'/api/data/',{
                method:"POST",
                credentials:"same-origin",
                headers:{
                    "Content-Type":"application/json",
                },
                body:JSON.stringify({
                    table:table,
                    col:whereCol,
                    op:whereOpe,
                    val:whereVal
                })
            }).then((response)=>{
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json()
            }).catch((error)=>{
                console.log(error);
                return [];
            });
        } else {
            console.log("Fetch Data, json");
            return readJsonFile(
                new URL(
                    path.join(dataDirectory, `${table}.json`), window.location.href
                )
            );
        }
    });
}