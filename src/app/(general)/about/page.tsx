import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import { fetchAbout } from "@/services/data_access";
import { PostType } from "@/types/post";
import { Metadata } from "next";
import { ArticleJsonLd, BreadcrumbJsonLd } from "../../../components/seo/JsonLd";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
    const about_: Array<PostType> = await fetchAbout();
    const main_image: string = about_.slice(-1)[0]?.main_image || "";
    return {
        title: 'About | Sujan Kumal | Software Engineer',
        description: "I'm Sujan Kumal, a software engineer with a strong passion for creating innovative solutions and exploring the world of technology. Here's a little bit about me:",
        openGraph: {
            images: [`/images/${main_image}`],
            type: 'website',
            url: 'https://sujankumal.com.np/',
            siteName: 'Sujan Kumal | Software Engineer',
            title: 'About | Sujan Kumal | Software Engineer',
            description: "I'm Sujan Kumal, a software engineer with a strong passion for creating innovative solutions and exploring the world of technology. Here's a little bit about me:",
        },
        twitter: {
            card: 'summary',
            creator: '@sujan_03_',
            site: '@sujan_03_',
            images: [`/images/${main_image}`],
            title: 'About | Sujan Kumal | Software Engineer',
            description: "I'm Sujan Kumal, a software engineer with a strong passion for creating innovative solutions and exploring the world of technology. Here's a little bit about me:",
        },
        robots: {
            index: true,
            follow: true,
        },
    }
}
async function About() {

    const posts: Array<PostType> = await fetchAbout();
    const mds = posts.slice(-1)[0]?.content?.map((content, index) => {
        return (content.content) ? <MarkdownComponent key={index} content={content.content} /> : <div></div>;
    });
    const about = posts.slice(-1)[0] ?? {};

    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            {/* Structured Data */}
            <ArticleJsonLd
                headline={about.title}
                description={about.description}
                author={{
                    name: String(about.author?.name || "Sujan Kumal"),
                    url: "https://sujankumal.com.np"
                }}
                datePublished={about.date?.toISOString()}
                dateModified={about.date?.toISOString()}
                url={`https://sujankumal.com.np/${about.url}`}
                image={about.main_image ? [(() => {
                    try {
                        new URL(about.main_image);
                        return about.main_image;
                    } catch { return `https://sujankumal.com.np/images/${about.main_image}`; }
                })(),
                ] : undefined}
                publisher={{
                    name: "Sujan Kumal",
                    url: "https://sujankumal.com.np"
                }}
            />
            <BreadcrumbJsonLd
                items={[
                    { name: "Home", url: "https://sujankumal.com.np" },
                    { name: about.title, url: `https://sujankumal.com.np/${about.url}` }
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
                                src={(() => {
                                    try {
                                        new URL(about.main_image);
                                        return about.main_image;
                                    } catch { return `/images/${about.main_image}`; }
                                })()
                                }
                                alt={"Image for " + about.title}
                                priority={true}
                            />
                            <figcaption className="ml-1 prose hover:prose-a:text-orange-600 text-xs dark:prose-a:text-inherit">
                                {
                                    (about.main_image_credit) ? <MarkdownComponent content={about.main_image_credit} /> : <div></div>
                                }
                            </figcaption>
                        </figure>
                        <div className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
                            <section className="prose max-w-none prose-blockquote:border-l-orange-600 hover:prose-a:text-orange-600 dark:prose-a:text-inherit prose-headings:text-inherit prose-strong:text-inherit dark:prose-strong:text-inherit dark:prose-headings:text-inherit">
                                {mds}
                            </section>
                        </div>
                    </div>
                </article>
            </div>

            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar />
                </div>
            </aside>
        </main>
    );
}

export default About;