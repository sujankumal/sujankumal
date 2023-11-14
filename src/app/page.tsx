// "use client";

import Sidebar from '@/components/Sidebar'
import { fetchSite } from '@/services/data_access';
import { SiteType } from '@/types/site';
import { Metadata, ResolvingMetadata } from 'next';

const sites:Array<SiteType> = await fetchSite().then((data)=>{
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
        <article className="block text-gray-800">
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
        <div className="w-auto">
          {
            // sites.map((site, index:number)=>{
            //   return <div key={index}>{site.title}
            //   </div>
            // })
            <div>Applications here</div>
          }
        </div>
      </div>
      <aside className="w-full md:col-span-1">
        <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
        <Sidebar/>
        </div>
      </aside>
    </main>
  )
}
