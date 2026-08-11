import PaginationPost from '@/components/Pagination/pagnate-post';
import Sidebar from '@/components/Sidebar';
import { fetchPostHome, fetchSite } from '@/services/data_access';
import { PostType } from '@/types/post';
import { SiteType } from '@/types/site';
import { Metadata } from 'next';
import { BlogJsonLd } from '../../components/seo/JsonLd';
import { generateMetadata as generateSEOMetadata, getSiteConfig } from '@/lib/seo';

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const site: SiteType = await fetchSite();
  return generateSEOMetadata({
    title: site.title,
    description: site.description,
    path: '/',
  });
}

export default async function Home() {
  const posts: Array<PostType> = await fetchPostHome();
  const sites: SiteType = await fetchSite();
  const dynamicConfig = await getSiteConfig();

  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      {/* Blog Structured Data */}
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
          <PaginationPost items={posts} pageSize={4} path="/articles" />
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
