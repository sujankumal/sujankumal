import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import { fetchAbout } from "@/services/data_access";
import { PostType } from "@/types/post";
import { Metadata } from "next";
import { ArticleJsonLd, BreadcrumbJsonLd } from "../../../components/seo/JsonLd";
import { generateMetadata as generateSEOMetadata, getSiteConfig } from "@/lib/seo";
import Image from "next/image";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const about_: Array<PostType> = await fetchAbout();
  const main_image: string = about_.slice(-1)[0]?.main_image || "";

  return generateSEOMetadata({
    title: "About",
    path: "/about",
    image: main_image,
  });
}

async function About() {
  const dynamicConfig = await getSiteConfig();

  const posts: Array<PostType> = await fetchAbout();
  const mds = posts.slice(-1)[0]?.content?.map((content, index) => {
    return content.content ? <MarkdownComponent key={index} content={content.content} /> : <div key={index} />;
  });
  const about = posts.slice(-1)[0] ?? {};

  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      {/* Structured Data */}
      <ArticleJsonLd
        headline={about.title}
        description={about.description}
        author={{
          name: String(about.author?.name || dynamicConfig.name),
          url: dynamicConfig.url,
        }}
        datePublished={about.date?.toISOString()}
        dateModified={about.date?.toISOString()}
        url={`${dynamicConfig.url}/${about.url}`}
        image={about.main_image ? [(() => {
          try {
            new URL(about.main_image);
            return about.main_image;
          } catch { return `${dynamicConfig.url}/images/${about.main_image}`; }
        })()] : undefined}
        publisher={{
          name: dynamicConfig.name,
          url: dynamicConfig.url,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: dynamicConfig.url },
          { name: about.title, url: `${dynamicConfig.url}/${about.url}` },
        ]}
      />

      <div className="mb-8 px-4 md:mx-8 md:col-span-3">
        <article>
          <div className="mb-5 mx-5">
            <figure className="w-auto">
              <Image
                className="w-auto rounded-lg"
                width={900}
                height={500}
                src={(() => {
                  try {
                    new URL(about.main_image);
                    return about.main_image;
                  } catch { return `/images/${about.main_image}`; }
                })()}
                alt={"Image for " + about.title}
                priority={true}
              />
              <figcaption className="ml-1 prose hover:prose-a:text-orange-600 text-xs dark:prose-a:text-inherit">
                {about.main_image_credit ? <MarkdownComponent content={about.main_image_credit} /> : <div />}
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