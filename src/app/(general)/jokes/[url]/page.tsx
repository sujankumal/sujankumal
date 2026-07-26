import PostDetailPage from "@/components/PostDetailPage";
import { fetchPostBySlug, fetchJokePostsUrl } from "@/services/data_access";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamicParams = true;

export async function generateStaticParams() {
  const urls = await fetchJokePostsUrl();
  return urls.map(({ url }) => ({ url: url.toString() }));
}

export async function generateMetadata({ params }: { params: Promise<{ url: string }> }): Promise<Metadata> {
  const { url } = await params;
  const joke = await fetchPostBySlug(decodeURIComponent(url));
  if (!joke) return {};

  return generateSEOMetadata({
    title: `Jokes | ${joke.title}`,
    description: joke.description,
    path: `/jokes/${joke.url}`,
    image: joke.main_image,
    type: "article",
    publishedTime: joke.date?.toISOString(),
  });
}

export default async function Joke({ params }: { params: Promise<{ url: string }> }) {
  const { url } = await params;
  const joke = await fetchPostBySlug(decodeURIComponent(url));
  if (!joke) notFound();

  return <PostDetailPage post={joke} />;
}