import { APP_BASE_URL } from "@/constants/config";
import { CatergoryType } from "@/types/category";
import Link from "next/link";

function CategoryButton({categories}:{categories:Array<CatergoryType>}) {
    
    return categories.map((category, index)=>{
        if (category.name.toLowerCase() == "index"){
          return;
        }
        return <span key={index}>
          <Link href={APP_BASE_URL+"category/"+category.id} className="bg-teal-600 p-1 m-1 text-xs text-white">{category.name}</Link>
        </span>
      });
}

export default CategoryButton;