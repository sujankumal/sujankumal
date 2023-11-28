import PaginationPost from "@/components/Pagination/pagnate-post";
import Sidebar from "@/components/Sidebar";

import { APP_BASE_URL } from "@/constants/constants";
import { fetchArticles } from "@/services/data_access";
import { PostType } from "@/types/post";

const articles:Array<PostType> = await fetchArticles();    
  
function Articles() {
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 p-4 md:m-8 md:col-span-3">
                <PaginationPost items={articles} pageSize={10} path={APP_BASE_URL+"articles/"}/>
            </div>
            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar/>
                </div>
            </aside>
        </main>
     );
}

export default Articles;