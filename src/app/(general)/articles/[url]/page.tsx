import CategoryButton from "@/components/Category/CategoryButton";
import DateTime from "@/components/DateTime/DateTime";
import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import UserLinkButton from "@/components/User/UserLinkButton";
import { fetchPostBySlug, fetchPostUrlArray } from "@/services/data_access";
import { Metadata } from "next";
import Image from "next/image";
import { ArticleJsonLd, BreadcrumbJsonLd } from "../../../../components/seo/JsonLd";

async function Article({params}:{params: Promise<{url:string}>}) {
    const url = (await params).url;
    
    const article = await fetchPostBySlug(url);
    
    const article_mds = article.content?.map((content, index)=>{
        // console.log(content, "cont");
        return (content.content)?<MarkdownComponent key={index} content={content.content} />:<div></div>;
    });

    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            {/* Structured Data */}
            <ArticleJsonLd
                headline={article.title}
                description={article.description}
                author={{
                    name: String(article.author?.name || "Sujan Kumal"),
                    url: "https://sujankumal.com.np"
                }}
                datePublished={article.date.toISOString()}
                dateModified={article.date.toISOString()}
                url={`https://sujankumal.com.np/articles${article.url}`}
                image={article.main_image ? [`https://sujankumal.com.np/images/${article.main_image}`] : undefined}
                publisher={{
                    name: "Sujan Kumal",
                    url: "https://sujankumal.com.np"
                }}
            />
            <BreadcrumbJsonLd
                items={[
                    { name: "Home", url: "https://sujankumal.com.np" },
                    { name: "Articles", url: "https://sujankumal.com.np/articles" },
                    { name: article.title, url: `https://sujankumal.com.np/articles/${article.url}` }
                ]}
            />

            <div className="mb-8 px-4 md:mx-8 md:col-span-3">
                <article>
                    <div className="mb-5 mx-5">
                        <figure className="w-auto">
                            <Image
                                className="w-auto rounded-lg"
                                // fill={true}
                                width={900}
                                height={500}
                                // src={"/images/"+article.main_image}
                                src={(() => {
                                    try {
                                        new URL(article.main_image);
                                        return article.main_image;
                                    } catch { return `/images/${article.main_image}`; }
                                    })()
                                }
                                alt={"Image for "+ article.title}
                                priority={true}
                            />
                            <figcaption className="ml-1 prose hover:prose-a:text-orange-600 text-xs dark:prose-a:text-inherit">
                                {
                                    (article.main_image_credit)?<MarkdownComponent content={article.main_image_credit} />:<div></div>
                                }
                            </figcaption>
                        </figure>
                        <div className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
                            <header className="mt-0">
                                <div className="my-1">
                                    {article.categories?<CategoryButton categories={article.categories}/>:<></>}
                                </div>
                                <div className="mb-0 ml-1">
                                    <h2>{article.title}</h2>
                                </div>
                                <div className="mt-5 text-xs">
                                    <div className="inline-flex justify-center mr-4">
                                        <DateTime datetime={article.date}/>
                                    </div>
                                    <div className="inline-flex">
                                        {article.author?<UserLinkButton user={article.author}/>:<></>}
                                    </div>
                                </div>
                            </header>
                            <section className="prose max-w-none prose-blockquote:border-l-orange-600 hover:prose-a:text-orange-600 dark:prose-a:text-inherit prose-headings:text-inherit prose-strong:text-inherit dark:prose-strong:text-inherit dark:prose-headings:text-inherit">
                                { article_mds }
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

export default Article;


export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const possibleValues = await fetchPostUrlArray().then((data)=>{
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
    const string = (await params).url;
    const article = await fetchPostBySlug(string);

    return  {
        title: `Articles | ${article.title}`,
        description: article.description,
        openGraph:{
          images:[`/images/${article.main_image}`],
          type:'website',
          url:'https://sujankumal.com.np/',
          siteName:'Sujan Kumal | Software Engineer',
          title: `Articles | ${article.title}`,
          description: article.description,
        },
        twitter:{
          card:'summary',
          creator:'@sujan_03_',
          site:'@sujan_03_',
          images:[`/images/${article.main_image}`],
          title: `Articles | ${article.title}`,
          description: article.description,
        },
        robots: {
            index: true,
            follow: true,
        },
        
      }
}