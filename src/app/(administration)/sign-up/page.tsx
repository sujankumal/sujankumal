'use client'

import { useEffect, useState ,Suspense} from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { _csrfToken } from "@/services/data_access";
import Link from "next/link";
import { Google } from "@mui/icons-material";
import { Alert, Slide, Snackbar } from "@mui/material";

function Signup() {
    const [show_alert, set_show_alert] = useState(false);
    const [show_error_message, set_show_error_message] = useState('');
    const [csrfToken, setCsrfToken] = useState('');
    
    const { data: session } = useSession();

    const searchParams = useSearchParams();
    // console.log("Query:",searchParams.get('error'));
    
    useEffect(()=>{
        if(searchParams.get('error')=="CredentialsSignin"){
            set_show_error_message('Please re-check Email or Password');
        }
    },[searchParams])
    
    useEffect(() => {
        let isMounted = true;
        _csrfToken()
            .then((data) => {
                if (isMounted) setCsrfToken(data);
            })
            .catch(() => {
                if (isMounted) set_show_error_message('Failed to load CSRF token. Please refresh.');
            });
        return () => { isMounted = false; };
    }, [])

    const handle_sign_up = ()=>{
        set_show_alert(true);
    }
    const handleAlertClose = () => {
        set_show_alert(false);
    }
    if (session) {
        return redirect('/dashboard');
    } else {
        return (
            <main className="p-2 w-full flex justify-center min-h-screen">
                <Snackbar open={show_alert} autoHideDuration={5000} onClose={handleAlertClose} anchorOrigin={{vertical:'bottom', horizontal:'center'}}>
                    <Alert onClose={handleAlertClose} severity="error" sx={{ width: '100%' }}>
                        Sorry! We are not able to sign up.
                    </Alert>
                </Snackbar>
                <div className="md:p-8 md:m-8 shadow-xl drop-shadow-xl bg-gray-400 rounded-lg h-fit">
                    <div className="text-lg font-bold text-gray-900 text-center">
                        Signup
                    </div>
                    <div className="w-fit m-2 md:w-96">
                        
                        <div className={"rounded-lg shadow-lg h-fit bg-gray-800 text-white min-w-fit text-sm"}>
                            <form className="m-4 p-8" id="form-sign-up">
                                <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
                                <div className="border-b-2 pb-2 border-b-teal-600">
                                    <div className="mb-4">
                                        <label className="block text-sm mb-2" htmlFor="name">
                                            Name
                                        </label>
                                        <input className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline" name="name" type="text" placeholder="Name" autoComplete="name" required />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm mb-2" htmlFor="email">
                                            Email
                                        </label>
                                        <input className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline" name="email" type="email" placeholder="example@sujankumal.com.np" autoComplete="email" required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm mb-2" htmlFor="password">
                                            Password
                                        </label>
                                        <input className="shadow border rounded w-full py-2 px-3 mb-3 leading-tight focus:outline-none focus:shadow-outline" name="password" type="password" placeholder="********" autoComplete="new-password" required minLength={8} />
                                        
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
                                    <Link href={'/log-in'} className="bg-teal-600 hover:bg-teal-800 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline text-center">
                                        Go to login page
                                    </Link>
                                </div>
                            </form>
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
                                    <span className="inline-flex flex-col justify-center px-2 text-sm">Sign up with google</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }
}

// export default Signup;
export default function SignupPage() {
    return (
      <Suspense fallback={<div>Loading Signup page...</div>}>
        <Signup />
      </Suspense>
    );
  }