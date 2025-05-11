import PaginationPost from '@/components/Pagination/pagnate-post';
import Sidebar from '@/components/Sidebar';
import { fetchPostHome, fetchSite } from '@/services/data_access';
import { PostType } from '@/types/post';
import { SiteType } from '@/types/site';
import { Metadata } from 'next';


const site:SiteType = await fetchSite();

export async function generateMetadata():Promise<Metadata>{
  return {
    title: site.title,
    robots: {
      index: true,
      follow: true,
    },
  }
}

export const revalidate = 86400;

export default async function Home() {
  const posts:Array<PostType> = await fetchPostHome();
  const sites:SiteType = await fetchSite();

  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      <div className="mb-8 p-4 md:m-8 md:col-span-3">
        <article className="block text-gray-800 dark:text-inherit">
            <h3 className="mb-4">{sites.greeting}</h3>
            <div>
                <p className='mb-4'>
                    <i>{sites.description}</i>
                </p>
                <p>
                  {sites.detail}
                </p>
            </div>
        </article>
        <hr className="w-full h-1 my-8 bg-gray-700 border-0 dark:bg-gray-700" />
        <div className="w-auto block">
          <PaginationPost items={posts} pageSize={4} path="/articles/"/>
        </div>
      </div>
      <aside className="w-full md:col-span-1">
        <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800 dark:text-inherit">
          <Sidebar/>
        </div>
      </aside>
    </main>
  )
}
