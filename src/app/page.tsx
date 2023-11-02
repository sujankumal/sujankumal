"use client";

import Sidebar from '@/components/Sidebar'
import { fetchData, isNodeJs } from '@/services/data_access';
import { PostType } from '@/types/post';
import { useEffect, useState } from 'react'
export default function Home() {

  const [posts, setPosts] = useState<Array<PostType>>([]);
  
  useEffect(()=>{
    fetchData('posts','id','=','1').then((data)=>{
      setPosts(data);
    });
  },[]);

  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-between">
      <div className="mb-8 p-4 md:m-8 md:col-span-3">
        <article className="block text-gray-800">
            <h3 className="mb-4">Welcome to Sujan Kumal&apos;s Site</h3>
            <div>
                <p className='mb-4'>
                    <i>Experienced Software Engineer | Innovative Problem Solver | Passionate About Technology</i>
                </p>
                <p>
                    Welcome to my digital space! I am Sujan Kumal, a dedicated and skilled software engineer with a 
                    passion for crafting solutions that make a difference. With a strong foundation in computer 
                    science and years of hands-on experience, I have had the privilege of working on a 
                    diverse range of projects, from web applications to mobile apps, and more.
                </p>
            </div>
        </article>
        <hr className="w-full h-1 my-8 bg-gray-700 border-0 dark:bg-gray-700" />
        <div className="w-auto">
          {
            posts.map((post:PostType, index:number)=>{
              return <div key={index}>
                <h3>{post.title}</h3>
                <p>{post.id}</p>
                </div>
            })
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
