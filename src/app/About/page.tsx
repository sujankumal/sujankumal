import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import { fetchAbout } from "@/services/data_access";
import { PostType } from "@/types/post";

const about:Array<PostType> = await fetchAbout().then((data)=>{
    console.log("Post ABOUT: ",data);
    return data;
  });    
const mds = about.slice(-1)[0].content?.map((content, index)=>{
    console.log(content, "cont");
    return (content.content)?<MarkdownComponent key={index} content={content.content} />:<div>vieo</div>;
});

function About() {
    
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-between">
            <div className="mb-8 p-4 md:m-8 md:col-span-3">
                <div className="prose prose-stone prose-sm">
                    { mds }
                </div>
            </div>
            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar/>
                </div>
            </aside>
        </main>
     );
}
// export async function getStaticProps() {
//     const content = "# About Me  Hello! I'm Sujan Kumal, a passionate software engineer born in September 1995 in Gorkha, Gandaki, Nepal, to Hindu parents.  ## Professional Background  ### Software Engineer  - **Experience:** Software Developer (Self Employed, 2019 – present) - **Previous Roles:**   - System Support at NIC Asia Bank (2019)   - Python Developer at All Spark (2022) - **Email:** setobhagera@gmail.com  ## Education  - **Master's Studies:** Prithvi Narayan Campus   - Major: Economics |  I'm a rebel with a cause, an economics enthusiast who believes that knowledge should be accessible to everyone, not just those with a college degree.  - **Bachelor's Degree:** Gandaki College of Engineering and Science   - Major: Software Engineering - **+2 Education:** Motherland Higher Secondary School   - Stream: Science - **Schooling:** Spiral Galaxy Academy   - SLC Graduate   - Gyankunj Boarding School Alumni  ## Skills  - **Javascript** - **React** - **Nextjs** - **Tailwindcss** - **Python**  - **Django** - **PHP** - **MySQL** - **PostgreSQL** - **And many more**  I bring a diverse set of skills to the table, including software development, fullstack, system support, and electrical expertise.   ## Interests  Apart from my work as a software developer, I find joy in spending time outdoors. When I'm forced indoors, you'll likely find me immersed in the worlds of sci-fi and fantasy through movies and television shows. I'm also an avid explorer of the latest technological advancements happening around the globe.  ## Awards and Certifications  - [List of awards or certifications I've received.]  Feel free to connect with me at [setobhagera@gmail.com](mailto:setobhagera@gmail.com)!"
   
//     return {
//       props: {
//         content,
//       },
//     };
//   }

export default About;