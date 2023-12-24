'use client'

import { useEffect, useState } from "react";
import { getCsrfToken, useSession, signIn, signOut } from "next-auth/react";

export const revalidate = 10;
function Signup() {
    // const [view_login, set_view_login] = useState(true);
    const [show_pass_error, set_show_pass_error] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    
    const { data: session } = useSession();
    console.log("login:", session);
    
    useEffect(()=>{
        const token:Promise<string> = getCsrfToken();
        token.then((data)=>{
            setCsrfToken(data);
        })
    },[csrfToken])
    
    console.log("csrfToken:",csrfToken);

    const handle_sign_up = ()=>{
        console.log("signUp");   
    }
    if (session) {
        return <>
            Signed in as {session.user?.email}
            <button className="p-2 mx-2 border border-teal-600" onClick={() => signOut()}>Sign Out</button>
        </>
    } else {
        return (
            <main className="p-2 w-full flex justify-center min-h-screen">
                <div className="md:p-8 md:m-8 shadow-xl drop-shadow-xl bg-gray-400 rounded-lg h-fit">
                    <div className="text-lg font-bold text-gray-900 text-center">
                        Signup
                    </div>
                    <div className="w-fit m-2 md:w-96">
                        
                        <div className={"rounded-lg shadow-lg h-fit bg-gray-800 text-white min-w-fit text-sm"}>
                            <form className="m-4 p-8" id="form-sign-up">
                                <div className="border-b-2 pb-2 border-b-teal-600">
                                    <div className="mb-4">
                                        <label className="block text-sm mb-2" htmlFor="name">
                                            Name
                                        </label>
                                        <input className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline" name="name" type="text" placeholder="Name" />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm mb-2" htmlFor="email">
                                            Email
                                        </label>
                                        <input className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline" name="email" type="email" placeholder="example@sujankumal.com.np" />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm mb-2" htmlFor="password">
                                            Password
                                        </label>
                                        <input className={`"shadow border ${show_pass_error ? 'border-red-500' : null} rounded w-full py-2 px-3 mb-3 leading-tight focus:outline-none focus:shadow-outline"`} name="password" type="password" placeholder="********" />
                                        {show_pass_error ? <p className="text-red-500 text-xs italic">Please choose a password.</p> : null}

                                    </div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={handle_sign_up} className="bg-teal-600 hover:bg-teal-800 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline" type="button">
                                            Create account
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="block my-2">Already have account?</div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <button onClick={() => { }} className="bg-teal-600 hover:bg-teal-800 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline" type="button">
                                        Sign In
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="w-full flex">
                        <div className="w-full flex flex-col justify-center"><div className="w-full h-[1px] bg-teal-800"></div></div>
                        <div className="w-fit m-1 text-teal-800">Or</div>
                        <div className="w-full flex flex-col justify-center"><div className="w-full h-[1px] bg-teal-800"></div></div>
                    </div>
                </div>
            </main>
        );
    }
}

export default Signup;