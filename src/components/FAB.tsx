'use client'
import { Photo, ShuffleOn, ViewInAr } from '@mui/icons-material';
import AppsIcon from '@mui/icons-material/Apps';
import Link from 'next/link';
import { useState } from 'react';

function FAB() {
    
    const [showMenu, setshowMenu] = useState(false);
    
    return <div className="fixed bottom-5 left-5">
        {/* {
            showMenu? */}
            <div className={showMenu?"block ml-1 text-teal-600 font-extrabold text-lg drop-shadow-[-2px_2px_0px_rgb(10,10,10)]":"hidden"}>
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/2048/" title="2048">
                        <ShuffleOn className="text-orange-700" fontSize="large"/>
                        <span className="ml-4">2048</span>
                    </Link>
			    </div>
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/apps/image/" title="Image">
                        <Photo className="text-green-600" fontSize="large"/>
                        <span className="ml-4">Image</span>
                    </Link>
			    </div>
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/apps/" title="Apps">
                        <ViewInAr className="text-orange-700" fontSize="large"/>
                        <span className="ml-4">Apps</span>
                    </Link>
			    </div>
		    </div>
            {/* :null
        } */}
        <div className="mt-5 hover:animate-bounce duration-300">
            <button className="bg-teal-600 p-1 rounded-full" onClick={() => setshowMenu(!showMenu)}>
               <AppsIcon className="text-white" fontSize="large"/>
            </button>
        </div>	
    </div>;
}

export default FAB;