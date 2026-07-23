import CategoryButton from "@/components/Category/CategoryButton";
import DateTime from "@/components/DateTime/DateTime";
import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import UserLinkButton from "@/components/User/UserLinkButton";
import { fetchPostBySlug, fetchJokePostsUrl} from "@/services/data_access";
import { Metadata, ResolvingMetadata } from "next";
import { generateMetadataAsync } from "@/lib/seo";
import Image from "next/image";
import { notFound } from "next/navigation";

async function Joke({params}:{params: Promise<{url:string}>}) {
    const {url} = await params;
    const decodedUrl = decodeURIComponent(url);
    const joke = await fetchPostBySlug(decodedUrl);
    if (!joke) {
        notFound();
    }
    const joke_mds = joke.content?.map((content, index)=>{
        // console.log(content, "cont");
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
                                src={"/images/"+joke.main_image}
                                alt={"Image for "+ joke.title}
                                priority={true}
                            />
                            <figcaption className="ml-1 prose hover:prose-a:text-orange-600 text-xs dark:prose-a:text-inherit">
                                {
                                    (joke.main_image_credit)?<MarkdownComponent content={joke.main_image_credit} />:<div></div>
                                }
                            </figcaption>
                        </figure>
                        <div className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
                            <header className="mt-0">
                                <div className="my-1">
                                    <CategoryButton categories={joke.categories}/>
                                </div>
                                <div className="mb-0 ml-1">
                                    <h2>{joke.title}</h2>
                                </div>
                                <div className="mt-5 text-xs">
                                    <div className="inline-flex justify-center mr-4">
                                        <DateTime datetime={joke.date}/>
                                    </div>
                                    <div className="inline-flex">
                                        <UserLinkButton user={joke.author}/>
                                    </div>
                                </div>
                            </header>
                            <section className="prose max-w-none prose-blockquote:border-l-orange-600 hover:prose-a:text-orange-600 dark:prose-a:text-inherit prose-headings:text-inherit prose-strong:text-inherit dark:prose-strong:text-inherit dark:prose-headings:text-inherit">
                                { joke_mds }
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

export default Joke;


export const dynamicParams = true // true | false,

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const possibleValues = await fetchJokePostsUrl().then((data)=>{
        // console.log("Array of post ids: ", data);
        return data.map((item)=>{
            return item.url;
        });
    }); // Adjust based on your data
    // console.log(possibleValues);

    // Generate an array of objects with the correct structure for static generation
    const paths = possibleValues.map((value) => ({
      url: value.toString(),
    }));
    // console.log("Paths ", paths);
    return paths;
  }


export async function generateMetadata({params}:{params: Promise<{url:string}>}): Promise<Metadata>{
    const url = (await params).url;
    const decodedUrl = decodeURIComponent(url);
    const article = await fetchPostBySlug(decodedUrl);
    if (!article) {
        return {};
    }

    return generateMetadataAsync({
        title: `Jokes | ${article.title}`,
        description: article.description,
        path: `/jokes/${article.url}`,
        image: article.main_image,
        type: "article",
        publishedTime: article.date?.toISOString(),
    });
}