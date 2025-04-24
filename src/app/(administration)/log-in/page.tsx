'use client'
import { useEffect, useState , Suspense} from "react";
import { signIn, useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { Google } from "@mui/icons-material";
import { _csrfToken } from "@/services/data_access";
import Link from "next/link";

function Login() {
    const [show_credentials_error, set_show_credentials_error] = useState(false);
    const [show_error_message, set_show_error_message] = useState('');
    const [csrfToken, setCsrfToken] = useState('');
    
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    // console.log("Query:",searchParams.get('error'));
    
    useEffect(()=>{
        if(searchParams.get('error')=="CredentialsSignin"){
            set_show_credentials_error(true);
            set_show_error_message('Please re-check Email or Password');
        }
    },[searchParams])
    
    useEffect(()=>{
        const token:Promise<string> = _csrfToken();
        token.then((data)=>{
            setCsrfToken(data);
        });
        // console.log("Useeffect:",csrfToken);
    },[])
    
    if (session) {
        return redirect('/dashboard');
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
                                        <input id="input-email-login" name="email" type="email" required placeholder="example@sujankumal.com.np" className={`"shadow border text-black ${show_credentials_error ? 'border-red-500' : ""} rounded w-full py-2 px-3 mb-3 focus:outline-none focus:shadow-outline"`}/>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm mb-2" htmlFor="password">
                                            Password
                                        </label>
                                        <input id="input-password-login" name="password" type="password" required placeholder="********" className={`"shadow border text-black ${show_credentials_error ? 'border-red-500' : ""} rounded w-full py-2 px-3 mb-3 leading-tight focus:outline-none focus:shadow-outline"`}/>
                                        {show_credentials_error && <p className="text-red-500 text-xs italic">{show_error_message}</p>}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <button type="submit"
                                            className="bg-teal-600 hover:bg-teal-800 text-white py-2 px-4 mr-6 rounded-3xl focus:outline-none focus:shadow-outline">
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
                                    <Link href={'/sign-up'} className="bg-teal-600 hover:bg-teal-800 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline text-center">
                                        Create account
                                    </Link>
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

// export default Login;
export default function LoginPage() {
    return (
      <Suspense fallback={<div>Loading login page...</div>}>
        <Login />
      </Suspense>
    );
  }