import { searchData } from "@/services/search";
import { Paper } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState , Suspense} from "react";

function SearchDialog() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query');
    
    const [posts, setPosts] = useState([]);
    useEffect(()=>{
        if (query){
            const data = searchData(query);
            data.then((d)=>{
                setPosts(d);
            });
        }
    }, [searchParams, query]);
    return ( 
        <Suspense fallback={<div>Loading...</div>}>
        <Paper
         elevation={8}
         component='div'
         className={query?"px-1 py-1 mt-1 border-2 border-teal-600 ":"hidden"}
        >
            {
            posts.map((item:{id:string, title:string},index)=>{
                return <Link href={'/articles/'+ item.id} key={index} className="block hover:bg-gray-800 hover:text-white py-2 px-1 w-full text-center">
                            {item.title}
                        </Link>
            })
            }
        </Paper>
        </Suspense>
     );
}

export default SearchDialog;