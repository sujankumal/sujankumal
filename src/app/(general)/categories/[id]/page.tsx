import CategoryButton from "@/components/Category/CategoryButton";
import DateTime from "@/components/DateTime/DateTime";
import Sidebar from "@/components/Sidebar";
import UserLinkButton from "@/components/User/UserLinkButton";

import { fetchCategoryById, fetchCategoryCountIdArray, fetchPostsByCategoryID } from "@/services/data_access";
import { CatergoryType } from "@/types/category";
import { PostType } from "@/types/post";
import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";

async function Category({params}:{params: {id:number}}) {
    const {id} = params;
    
    const posts = await fetchPostsByCategoryID(id);

    return (  
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 px-4 md:mx-8 md:col-span-3">
            {
                    posts.map((post:PostType, index)=>{
                        return <div key={index} className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
                        <header className="mt-5 text-center">
                          <div className="block m-1 p-1">
                            <CategoryButton categories={post.categories}/>
                          </div>
                          <div className="mb-2">
                            <h2>
                              <Link href={"/articles/"+post.id} className="text-teal-600">{post.title}</Link>
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
                }
            </div>
            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar/>
                </div>
            </aside>
        </main>
    );
}

export default Category;


export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const possibleValues = await fetchCategoryCountIdArray().then((data)=>{
        // console.log("Array of post ids: ", data);
        return data.map((item)=>{
            return item.id;
        });
    }); // Adjust based on your data
    // console.log(possibleValues);

    // Generate an array of objects with the correct structure for static generation
    const paths = possibleValues.map((value) => ({
      id: value.toString(),
    }));
    // console.log("Paths ", paths);
    return paths;
  }

  export async function generateMetadata({params}:{params: {id:number}}, parent: ResolvingMetadata): Promise<Metadata>{
    const {id} = params;
    
    const category: CatergoryType = await fetchCategoryById(id);

    return  {
        title: `Category | ${category.name}` ,
        description: `This page provides concise summaries of key topics and links to related category of ${category.name} for further exploration.`,
        openGraph:{
          images:['/bird-1024x576-20.gif'],
          type:'website',
          url:'https://sujankumal.com.np/',
          siteName:'Er. Sujan Kumal | A Software Engineer',
          title: `Category | ${category.name}` ,
          description: `This page provides concise summaries of key topics and links to related category of ${category.name} for further exploration.`,
        },
        twitter:{
          card:'summary_large_image',
          creator:'@sujan_03_',
          site:'@sujan_03_',
          images:['/bird-1024x576-20.gif'],
          title: `Category | ${category.name}` ,
          description: `This page provides concise summaries of key topics and links to related category of ${category.name} for further exploration.`,
        },
      }
}