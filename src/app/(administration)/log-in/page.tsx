'use client'
import { useEffect, useState } from "react";
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Google } from "@mui/icons-material";


export const revalidate = 10; 

function Login() {
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
    if (session) {
        return redirect('/admin');
    } else {
        return (
            <main className="p-2 w-full flex justify-center min-h-screen">
                <div className="md:p-8 md:m-8 shadow-xl drop-shadow-xl bg-gray-400 rounded-lg h-fit">
                    <div className="text-lg font-bold text-gray-900 text-center">
                        Login
                    </div>
                    <div className="w-fit m-2 md:w-96">
                        <div className={"rounded-lg shadow-lg h-fit bg-gray-800 text-white text-sm"}>
                            <form className="m-4 p-8" id="form-sign-in" method="POST" action="/api/auth/callback/credentials">
                                <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
                                <div className="border-b-2 pb-2 border-b-teal-600">
                                    <div className="mb-4">
                                        <label className="block text-sm mb-2" htmlFor="email">
                                            Email
                                        </label>
                                        <input id="input-email-login" name="email" type="email" placeholder="example@sujankumal.com.np" className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"/>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm mb-2" htmlFor="password">
                                            Password
                                        </label>
                                        <input id="input-password-login" name="password" type="password" placeholder="********" className={`"shadow border ${show_pass_error ? 'border-red-500' : null} rounded w-full py-2 px-3 mb-3 leading-tight focus:outline-none focus:shadow-outline"`}/>
                                        {show_pass_error ? <p className="text-red-500 text-xs italic">Please choose a password.</p> : null}

                                    </div>
                                    <div className="flex items-center justify-between">
                                        <button className="bg-teal-600 hover:bg-teal-800 text-white py-2 px-4 mr-6 rounded-3xl focus:outline-none focus:shadow-outline" type="submit">
                                            Sign In
                                        </button>
                                        <a className="inline-block align-baseline text-sm text-teal-600 hover:text-teal-800 ml-6" href="#">
                                            Forgot Password?
                                        </a>
                                    </div>
                                </div>
                            </form>
                            <div className="mx-4 px-8 mb-4 pb-8">
                                <div className="flex items-center justify-center">
                                    <div className="block my-2">Don&apos;t have account?</div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <button onClick={() => { redirect('/sign-up'); }} className="bg-teal-600 hover:bg-teal-800 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline" type="button">
                                        Create account
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                    <div className="w-full flex">
                        <div className="w-full flex flex-col justify-center"><div className="w-full h-[1px] bg-teal-800"></div></div>
                        <div className="w-fit m-1 text-teal-800">Or</div>
                        <div className="w-full flex flex-col justify-center"><div className="w-full h-[1px] bg-teal-800"></div></div>
                    </div>
                    <div className="w-full p-2">
                        <div className="flex items-center justify-center">
                            <button onClick={() => { signIn("google") }} className="bg-teal-600 hover:bg-teal-800 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline" type="button">
                                <span>
                                    <Google/>
                                    <span className="inline-flex flex-col justify-center px-2 text-sm">Login with google</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }
}

export default Login;