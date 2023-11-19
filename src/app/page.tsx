// "use client";

import CategoryButton from '@/components/Category/CategoryButton';
import DateTime from '@/components/DateTime/DateTime';
import Sidebar from '@/components/Sidebar'
import UserLinkButton from '@/components/User/UserLinkButton';
import { APP_BASE_URL } from '@/constants/config';
import { fetchPostHome, fetchSite } from '@/services/data_access';
import { CatergoryType } from '@/types/category';
import { PostType } from '@/types/post';
import { SiteType } from '@/types/site';
import { Metadata } from 'next';
import Link from 'next/link';

const sites:Array<SiteType> = await fetchSite().then((data)=>{
  return data;
});

const posts:Array<PostType> = await fetchPostHome().then((data)=>{
  console.log("Post HOme: ",data);
  return data;
});

export async function generateMetadata():Promise<Metadata>{
  return {
    title: sites.slice(-1)[0].title
  }
}

export default async function Home() {
  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-between">
      <div className="mb-8 p-4 md:m-8 md:col-span-3">
        <article className="block text-gray-800 dark:text-inherit">
            <h3 className="mb-4">{sites.slice(-1)[0].greeting}</h3>
            <div>
                <p className='mb-4'>
                    <i>{sites.slice(-1)[0].description}</i>
                </p>
                <p>
                  {sites.slice(-1)[0].detail}
                </p>
            </div>
        </article>
        <hr className="w-full h-1 my-8 bg-gray-700 border-0 dark:bg-gray-700" />
        <div className="w-auto block">
          {
            posts.map((post:PostType, index:number)=>{
              
              return <div key={index} className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
                  <header className="mt-5 text-center">
                    <div className="block m-1 p-1">
                      <CategoryButton categories={post.categories}/>
                    </div>
                    <div className="mb-2">
                      <h2>
                        <Link href={APP_BASE_URL+"articles/"+post.id} className="text-teal-600">{post.title}</Link>
                      </h2>
                    </div>
                  </header>
                  <div className="text-center">
                    <p>{post.description}</p>
                  </div>
                  <footer className="mt-5 text-center text-xs">
                    <div className="inline-flex justify-center mr-4">
                      <DateTime datetime={post.date}/>
                    </div>
                    <div className="inline-flex">
                      <UserLinkButton user={post.author}/>
                    </div>
                  </footer>
              </div>
            })
            // <div>Applications here</div>
          }
        </div>
      </div>
      <aside className="w-full md:col-span-1 mb-3">
        <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800 dark:text-inherit">
          <Sidebar/>
        </div>
      </aside>
    </main>
  )
}
