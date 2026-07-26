import Sidebar from "@/components/Sidebar";
import { fetchProjects } from "@/services/data_access";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { ProjectType } from "@/types/project";
import { Metadata } from "next";
import { Noto_Sans_Mono } from "next/font/google";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: "Projects",
    description: "See what we've accomplished: Browse our impressive portfolio of projects.",
    path: "/projects",
  });
}

const noto_mono = Noto_Sans_Mono({ subsets: ['latin'] });

async function Projects() {
  const projects: ProjectType[] = await fetchProjects();
  return (
    <main className={`grid md:grid-cols-4 min-h-screen justify-center ${noto_mono.className}`}>
      <div className="mb-8 p-4 md:m-8 md:col-span-3 inline-flex justify-center">
        <div className="max-w-none">
          {projects.map((proj, index) => (
            <div className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-600" key={index}>
              <div className="bg-white p-4 md:py-10 md:px-8 rounded-xl shadow-lg">
                <header className="mt-2 text-center">
                  <div className="mb-2">
                    <h2>
                      <Link href={proj.link} className="text-orange-600">{proj.title}</Link>
                    </h2>
                  </div>
                </header>
                <div className="text-center">
                  <p>{proj.description}</p>
                </div>
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

export default Projects;