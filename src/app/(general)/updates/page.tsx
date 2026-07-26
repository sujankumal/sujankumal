import DateTime from "@/components/DateTime/DateTime";
import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import { fetchUpdates } from "@/services/data_access";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: "Updates",
    description: "This page provides latest news, events, updates etc.",
    path: "/updates",
  });
}

async function Updates() {
  const updates = await fetchUpdates();
  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      <div className="mb-8 p-4 md:m-8 md:col-span-3 inline-flex justify-center">
        <div className="grid md:grid-cols-2 gap-3">
          {updates.map((update, index) => (
            <div key={index} className="w-full p-4 rounded-lg bg-white shadow-lg shadow-gray-500 md:col-span-1">
              <div className="text-center text-lg font-bold p-5 underline">{update.title}</div>
              <div className="prose prose-stone prose-sm dark:prose-invert">
                <MarkdownComponent content={update.update} />
              </div>
              <div>
                <DateTime datetime={update.date} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="w-full md:col-span-1">
        <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
          <Sidebar />
        </div>
      </aside>
    </main>
  );
}

export default Updates;