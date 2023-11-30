import CategoryButton from "@/components/Category/CategoryButton";
import DateTime from "@/components/DateTime/DateTime";
import Sidebar from "@/components/Sidebar";
import UserLinkButton from "@/components/User/UserLinkButton";
import { APP_BASE_URL } from "@/constants/constants";
import { fetchCategoryCountIdArray, fetchPostsByCategoryID } from "@/services/data_access";
import { PostType } from "@/types/post";
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