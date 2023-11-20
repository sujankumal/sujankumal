import { APP_BASE_URL } from "@/constants/config";
import { CategoriesOnPosts } from "@/types/category-post";
import Link from "next/link";

function CategoryButton({categories}:{categories:Array<CategoriesOnPosts>}) {
    
    return categories.map((categoryonpost, index)=>{
        
      if (categoryonpost.category.name.toLowerCase() == "index"){
          return;
        }
        return <span key={index}>
          <Link href={APP_BASE_URL+"category/"+categoryonpost.category.id} className="bg-teal-600 p-1 m-1 text-xs text-white">{categoryonpost.category.name}</Link>
        </span>
      });
}

export default CategoryButton;