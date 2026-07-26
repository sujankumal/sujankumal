import PaginationPost from "@/components/Pagination/pagnate-post";
import Sidebar from "@/components/Sidebar";
import { PostType } from "@/types/post";

interface PostListPageProps {
  posts: PostType[];
  path: string;
  pageSize?: number;
}

/**
 * Shared layout for paginated post-list pages (articles, jokes, technologies, etc.).
 * Renders a 4-column grid with the pagination list in the main area and a sidebar.
 */
export default function PostListPage({ posts, path, pageSize = 10 }: PostListPageProps) {
  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      <div className="mb-8 p-4 md:m-8 md:col-span-3">
        <PaginationPost items={posts} pageSize={pageSize} path={path} />
      </div>
      <aside className="w-full md:col-span-1">
        <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
          <Sidebar />
        </div>
      </aside>
    </main>
  );
}
