import PaginationPost from '@/components/Pagination/pagnate-post';
import Sidebar from '@/components/Sidebar';
import { fetchPostHome, fetchSite } from '@/services/data_access';
import { PostType } from '@/types/post';
import { SiteType } from '@/types/site';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { BlogJsonLd } from '../../components/seo/JsonLd';
import { generateMetadata as generateSEOMetadata, getSiteConfig } from '@/lib/seo';

export const instant = false;

function PostListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading posts" className="w-full">
      {Array.from({ length: 4 }, (_, index) => (
        <article
          key={index}
          aria-hidden="true"
          className="mt-2 mb-5 space-y-3 border-b border-dashed border-gray-300 pb-6 dark:border-gray-700"
        >
          <div className="mx-auto mt-5 h-4 w-24 animate-pulse rounded-sm bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          <div className="mx-auto h-6 w-4/5 max-w-lg animate-pulse rounded-sm bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          <div className="mx-auto h-4 w-full max-w-2xl animate-pulse rounded-sm bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          <div className="mx-auto h-4 w-3/4 max-w-xl animate-pulse rounded-sm bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          <div className="mx-auto h-3 w-40 animate-pulse rounded-sm bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
        </article>
      ))}
    </div>
  );
}

async function HomePosts({
  postsPromise,
  sites,
  dynamicConfig,
}: {
  postsPromise: Promise<Array<PostType>>;
  sites: SiteType;
  dynamicConfig: Awaited<ReturnType<typeof getSiteConfig>>;
}) {
  const posts = await postsPromise;

  return (
    <>
      <BlogJsonLd
        name={dynamicConfig.name}
        description={sites.description}
        url={dynamicConfig.url}
        author={{
          name: dynamicConfig.name,
          url: dynamicConfig.url,
        }}
        posts={posts.slice(0, 5).map(post => ({
          headline: post.title,
          url: `${dynamicConfig.url}/articles/${post.url}`,
          datePublished: post.date.toISOString(),
        }))}
      />
      <PaginationPost items={posts} pageSize={4} path="/articles" />
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const site: SiteType = await fetchSite();
  return generateSEOMetadata({
    title: site.title,
    description: site.description,
    path: '/',
  });
}

export default async function Home() {
  const postsPromise = fetchPostHome();
  const [sites, dynamicConfig] = await Promise.all([fetchSite(), getSiteConfig()]);

  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      <div className="mb-8 p-4 md:m-8 md:col-span-3">
        <article className="block text-gray-800 dark:text-inherit">
          <h3 className="mb-4">{sites.greeting}</h3>
          <div>
            <p className="mb-4">
              <i>{sites.description}</i>
            </p>
            <p>{sites.detail}</p>
          </div>
        </article>
        <hr className="w-full h-1 my-8 bg-gray-700 border-0 dark:bg-gray-700" />
        <div className="w-auto block">
          <Suspense fallback={<PostListSkeleton />}>
            <HomePosts
              postsPromise={postsPromise}
              sites={sites}
              dynamicConfig={dynamicConfig}
            />
          </Suspense>
        </div>
      </div>
      <aside className="w-full md:col-span-1">
        <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800 dark:text-inherit">
          <Sidebar />
        </div>
      </aside>
    </main>
  );
}
