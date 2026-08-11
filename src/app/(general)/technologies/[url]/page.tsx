import PostDetailPage from "@/components/PostDetailPage";
import { fetchPostBySlug, fetchTechPostsUrl } from "@/services/data_access";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const instant = false;

export async function generateStaticParams() {
  const urls = await fetchTechPostsUrl();
  return urls.map(({ url }) => ({ url: url.toString() }));
}

export async function generateMetadata({ params }: { params: Promise<{ url: string }> }): Promise<Metadata> {
  const { url } = await params;
  const tech = await fetchPostBySlug(decodeURIComponent(url));
  if (!tech) return {};

  return generateSEOMetadata({
    title: `Technologies | ${tech.title}`,
    description: tech.description,
    path: `/technologies/${tech.url}`,
    image: tech.main_image,
    type: "article",
    publishedTime: tech.date?.toISOString(),
  });
}

export default async function Tech({ params }: { params: Promise<{ url: string }> }) {
  const { url } = await params;
  const tech = await fetchPostBySlug(decodeURIComponent(url));
  if (!tech) notFound();

  return <PostDetailPage post={tech} />;
}