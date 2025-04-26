import CategoryButton from "@/components/Category/CategoryButton";
import DateTime from "@/components/DateTime/DateTime";
import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import UserLinkButton from "@/components/User/UserLinkButton";
import { fetchTechPostByID, fetchTechPostCountIdArray } from "@/services/data_access";
import { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";

async function Tech({params}:{params: Promise<{id:number}>}) {
    const {id} = await params;
    const tech = await fetchTechPostByID(id);
    
    const tech_mds = tech.content?.map((content, index)=>{
        return (content.content)?<MarkdownComponent key={index} content={content.content} />:<div></div>;
    });

    return (  
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 px-4 md:mx-8 md:col-span-3">
                <article>
                    <div className="mb-5 mx-5">
                        <figure className="w-auto">
                            <Image
                                className="w-auto rounded-lg"
                                // fill={true}
                                width={900}
                                height={500}
                                src={"/images/"+tech.main_image}
                                alt={"Image for "+ tech.title}
                                priority={true}
                            />
                            <figcaption className="ml-1 prose hover:prose-a:text-teal-600 text-xs dark:prose-a:text-inherit">
                                {
                                    (tech.main_image_credit)?<MarkdownComponent content={tech.main_image_credit} />:<div></div>
                                }
                            </figcaption>
                        </figure>
                        <div className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
                            <header className="mt-0">
                                <div className="my-1">
                                    <CategoryButton categories={tech.categories}/>
                                </div>
                                <div className="mb-0 ml-1">
                                    <h2>{tech.title}</h2>
                                </div>
                                <div className="mt-5 text-xs">
                                    <div className="inline-flex justify-center mr-4">
                                        <DateTime datetime={tech.date}/>
                                    </div>
                                    <div className="inline-flex">
                                        <UserLinkButton user={tech.author}/>
                                    </div>
                                </div>
                            </header>
                            <section className="prose max-w-none prose-blockquote:border-l-teal-600 hover:prose-a:text-teal-600 dark:prose-a:text-inherit prose-headings:text-inherit prose-strong:text-inherit dark:prose-strong:text-inherit dark:prose-headings:text-inherit">
                                { tech_mds }
                            </section>
                        </div>
                    </div>
                </article>
            </div>
            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar/>
                </div>
            </aside>
        </main>
    );
}

export default Tech;


export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const possibleValues = await fetchTechPostCountIdArray().then((data)=>{
        return data.map((item)=>{
            return item.id;
        });
    });
    // Generate an array of objects with the correct structure for static generation
    const paths = possibleValues.map((value) => ({
      id: value.toString(),
    }));
    return paths;
  }


export async function generateMetadata({params}:{params: Promise<{id:number}>}, parent: ResolvingMetadata): Promise<Metadata>{
    const id = (await params).id;
    const article = await fetchTechPostByID(id);

    return  {
        title: `Technologies | ${article.title}`,
        description: article.description,
        openGraph:{
          images:[`/images/${article.main_image}`],
          type:'website',
          url:'https://sujankumal.com.np/',
          siteName:'Sujan Kumal | A Software Engineer',
          title: `Technologies | ${article.title}`,
          description: article.description,
        },
        twitter:{
          card:'summary',
          creator:'@sujan_03_',
          site:'@sujan_03_',
          images:[`/images/${article.main_image}`],
          title: `Technologies | ${article.title}`,
          description: article.description,
        },
        robots: {
            index: true,
            follow: true,
        },
        
      }
}