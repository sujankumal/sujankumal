import CategoryButton from "@/components/Category/CategoryButton";
import DateTime from "@/components/DateTime/DateTime";
import Sidebar from "@/components/Sidebar";
import UserLinkButton from "@/components/User/UserLinkButton";
import { fetchCategoryNameArray, fetchPostsByCategoryID, fetchCategoryByName } from "@/services/data_access";
import { CatergoryType } from "@/types/category";
import { PostType } from "@/types/post";
import { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export const instant = false;

export async function generateStaticParams() {
  const possibleValues = await fetchCategoryNameArray();
  return possibleValues.map((item) => ({
    name: item.name,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const category: CatergoryType = await fetchCategoryByName(name);
  if (!category) return {};

  return generateSEOMetadata({
    title: `Category | ${category.name}`,
    description: `This page provides concise summaries of key topics and links to related category of ${category.name} for further exploration.`,
    path: `/categories/${category.name}`,
  });
}

export default async function Category({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const category = await fetchCategoryByName(name);
  if (!category) {
    notFound();
  }
  const posts = await fetchPostsByCategoryID(category.id);

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <main className="grid md:grid-cols-4 min-h-screen justify-center">
        <div className="mb-8 px-4 md:mx-8 md:col-span-3">
          {posts.map((post: PostType, index) => (
            <div key={index} className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
              <header className="mt-5 text-center">
                <div className="block m-1 p-1">
                  <CategoryButton categories={post.categories} />
                </div>
                <div className="mb-2">
                  <h2>
                    <Link href={`/articles/${post.url}`} className="text-orange-600">
                      {post.title}
                    </Link>
                  </h2>
                </div>
              </header>
              <div className="text-center">
                <p>{post.description}</p>
              </div>
              <footer className="mt-5 text-center text-xs">
                <div className="inline-flex justify-center mr-4">
                  <DateTime datetime={post.date} />
                </div>
                <div className="inline-flex">
                  <UserLinkButton user={post.author} />
                </div>
              </footer>
            </div>
          ))}
        </div>
        <aside className="w-full md:col-span-1">
          <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
            <Sidebar />
          </div>
        </aside>
      </main>
    </Suspense>
  );
}