import Sidebar from "@/components/Sidebar";
import { Metadata } from "next";
import Image from "next/image";
import prisma from "@/../prisma/prisma";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: "Our Team",
    description: "Meet our dedicated team, the driving force behind our success and innovation.",
    path: "/team",
  });
}

async function Team() {
  const teamMembers = await prisma.user.findMany({
    where: { verified: true },
    include: { profile: true },
  });

  const membersToDisplay = teamMembers.length > 0 ? teamMembers : [
    {
      id: 0,
      name: "Bot",
      image: "/bird-800x800-20.gif",
      profile: {
        status: "Site Bot",
        image: "/bird-800x800-20.gif",
      },
    },
  ];

  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      <div className="mb-8 p-4 md:m-8 md:col-span-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full gap-3 h-max">
          {membersToDisplay.map((member, index) => {
            const img = member.profile?.image || member.image || "/bird-800x800-20.gif";
            return (
              <div key={member.id || index} className="col-span-1 p-3 bg-white rounded-lg shadow-lg">
                <div className="border-b border-gray-400 mb-2 relative h-48 w-full">
                  <Image
                    className="rounded-lg object-cover"
                    fill
                    src={img}
                    alt={`Image for team member: ${member.name}`}
                    priority={index === 0}
                    unoptimized
                  />
                </div>
                <div className="text-gray-800 font-semibold mt-2">Name: {member.name || "Bot"}</div>
                {member.profile?.status && (
                  <div className="text-xs text-gray-500 mt-1">Role: {member.profile.status}</div>
                )}
              </div>
            );
          })}
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

export default Team;