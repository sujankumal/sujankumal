'use client'
import { PostType } from "@/types/post";
import { useEffect, useState } from "react";
import CategoryButton from "../Category/CategoryButton";
import Link from "next/link";
import DateTime from "../DateTime/DateTime";
import UserLinkButton from "../User/UserLinkButton";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import paginateListButtons from "./paginate-list-buttons";
import { useMediaQuery, useTheme } from "@mui/material";

function PaginationPost(
    { items, pageSize, path }:
        { items: Array<PostType>, pageSize: number, path: string }) {

    const [posts, setPosts] = useState<Array<PostType>>([]);
    const [currentPage, setCurrentPage] = useState(1);
    
    const numberOfPagesCeil = Math.ceil(items.length / pageSize);
    const [totalButtonDisplayOnPagination, settotalButtonDisplayOnPagination] = useState(7);
    
    const theme = useTheme();
    const matches_sm = useMediaQuery(theme.breakpoints.down('sm'));
    const matches_md = useMediaQuery(theme.breakpoints.down('md'));
    
    useEffect(()=>{
        if(matches_sm){
            settotalButtonDisplayOnPagination(3);
        }else if(matches_md){
            settotalButtonDisplayOnPagination(5);
        }else{
            settotalButtonDisplayOnPagination(7);
        }
    },[matches_sm, matches_md]);

    useEffect(() => {
        setPosts(items.slice((currentPage - 1) * pageSize, currentPage * pageSize));
    }, [currentPage, items, pageSize]);


    return (
        <div className="w-full">
            {
                posts?.map((post, index) => {
                    return <div key={index} className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
                        <header className="mt-5 text-center">
                            <div className="block m-1 p-1">
                                <CategoryButton categories={post.categories} />
                            </div>
                            <div className="mb-2">
                                <h2>
                                    <Link href={path + post.id} className="text-teal-600">{post.title}</Link>
                                </h2>
                            </div>
                        </header>
                        <div className="text-center">
                            <p>{post.description}</p>
                        </div>
                        <footer className="mt-5 text-center text-xs">
                            <div className="inline-flex justify-center mr-4">
                                <DateTime datetime={post.date} />
                            </div>
                            <div className="inline-flex">
                                <UserLinkButton user={post.author} />
                            </div>
                        </footer>
                    </div>

                })
            }
            
            <nav className="w-full inline-flex justify-center">
                {/* Navigation For Pagination */}
                <ul className="flex items-center h-6 text-xs">
                    <li>
                        <button disabled={currentPage <= 1}
                            onClick={() => {
                                if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                }
                            }}
                            className="flex disabled:hover:bg-white disabled:hover:text-gray-300 disabled:text-gray-300 items-center justify-center px-3 h-6 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                            <span className="sr-only">Previous</span>
                            <ChevronLeft />
                        </button>
                    </li>
                    {
                        paginateListButtons(currentPage, numberOfPagesCeil, setCurrentPage, totalButtonDisplayOnPagination)
                    }
                    <li>
                        <button onClick={() => {
                            if (currentPage < numberOfPagesCeil) {
                                setCurrentPage(currentPage + 1);
                            }
                        }} disabled={currentPage >= numberOfPagesCeil}
                            className="flex disabled:hover:bg-white disabled:hover:text-gray-300 disabled:text-gray-300 items-center justify-center px-3 h-6 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                            <span className="sr-only">Next</span>
                            <ChevronRight />
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

export default PaginationPost;