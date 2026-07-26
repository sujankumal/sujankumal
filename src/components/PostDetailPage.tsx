import CategoryButton from "@/components/Category/CategoryButton";
import DateTime from "@/components/DateTime/DateTime";
import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import UserLinkButton from "@/components/User/UserLinkButton";
import { PostType } from "@/types/post";
import Image from "next/image";

interface PostDetailPageProps {
  post: PostType;
}

/**
 * Shared layout for full post detail pages (articles, jokes, technologies, etc.).
 * Resolves the hero image URL (external or local), renders structured header,
 * markdown content sections, and sidebar.
 */
export default function PostDetailPage({ post }: PostDetailPageProps) {
  const imageUrl = (() => {
    try {
      new URL(post.main_image);
      return post.main_image;
    } catch {
      return `/images/${post.main_image}`;
    }
  })();

  const contentSections = post.content?.map((content, index) =>
    content.content
      ? <MarkdownComponent key={index} content={content.content} />
      : <div key={index} />,
  );

  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      <div className="mb-8 px-4 md:mx-8 md:col-span-3">
        <article>
          <div className="mb-5 mx-5">
            <figure className="w-auto">
              <Image
                className="w-auto rounded-lg"
                width={900}
                height={500}
                src={imageUrl}
                alt={`Image for ${post.title}`}
                priority={true}
              />
              <figcaption className="ml-1 prose hover:prose-a:text-orange-600 text-xs dark:prose-a:text-inherit">
                {post.main_image_credit
                  ? <MarkdownComponent content={post.main_image_credit} />
                  : <div />}
              </figcaption>
            </figure>

            <div className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
              <header className="mt-0">
                <div className="my-1">
                  {post.categories
                    ? <CategoryButton categories={post.categories} />
                    : null}
                </div>
                <div className="mb-0 ml-1">
                  <h2>{post.title}</h2>
                </div>
                <div className="mt-5 text-xs">
                  <div className="inline-flex justify-center mr-4">
                    <DateTime datetime={post.date} />
                  </div>
                  <div className="inline-flex">
                    {post.author ? <UserLinkButton user={post.author} /> : null}
                  </div>
                </div>
              </header>

              <section className="prose max-w-none prose-blockquote:border-l-orange-600 hover:prose-a:text-orange-600 dark:prose-a:text-inherit prose-headings:text-inherit prose-strong:text-inherit dark:prose-strong:text-inherit dark:prose-headings:text-inherit">
                {contentSections}
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
