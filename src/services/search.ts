import { notFound } from "next/navigation";
import prisma from "../../prisma/prisma";
import { isExternalFetchSet } from "./data_access";
import { API_BASE_URL } from "@/constants/constants";

export async function searchData(query:string){
    try {
        return fetch(API_BASE_URL + "/api/search/"+query, {
            method: "GET",
            next: {
                revalidate: 10,
            }
        }).then((response) => {
            if (!response.ok) {
                return [];
            }
            return response.json();
        });
    }catch(error){
        return [];
    }
}