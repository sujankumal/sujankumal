import { Paper } from "@mui/material";
import { useSearchParams } from "next/navigation";

function SearchDialog() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query');
    
    return ( 
        <Paper
         elevation={8}
         component='div'
         className={query?"flex justify-center px-1 py-1 mt-1 border-2 border-teal-600 ":"hidden"}
        >
            <div>
                {query}
            </div>
        </Paper>
     );
}

export default SearchDialog;