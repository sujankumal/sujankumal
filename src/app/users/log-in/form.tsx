"use client"

import { useState } from "react";

function LoginForms() {
    const [view_login, set_view_login] = useState(true);
    const [show_pass_error, set_show_pass_error] = useState(false);

    return ( <div className="w-fit md:w-96 ">
        <div className={(view_login)?"rounded-lg shadow-lg h-fit bg-gray-800 text-white text-sm":"hidden"}>
            <form className="m-4 p-8" id="form-sign-in">
                <div className="border-b-2 pb-2 border-b-teal-600">
                    <div className="mb-4">
                        <label className="block text-sm mb-2" htmlFor="email">
                            Email
                        </label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline" id="email" type="text" placeholder="example@sujankumal.com.np" />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm mb-2" htmlFor="password">
                            Password
                        </label>
                        <input className={`"shadow appearance-none border ${show_pass_error?'border-red-500':null} rounded w-full py-2 px-3 mb-3 leading-tight focus:outline-none focus:shadow-outline"`} id="password" type="password" placeholder="********" />
                        {show_pass_error?<p className="text-red-500 text-xs italic">Please choose a password.</p>:null}
                        
                    </div>
                    <div className="flex items-center justify-between">
                        <button className="bg-teal-600 hover:bg-teal-800 text-white py-2 px-4 mr-6 rounded focus:outline-none focus:shadow-outline" type="button">
                            Sign In
                        </button>
                        <a className="inline-block align-baseline text-sm text-teal-600 hover:text-teal-800 ml-6" href="#">
                            Forgot Password?
                        </a>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <div className="block">Or</div>
                </div>
                <div className="flex items-center justify-center">
                    <button onClick={()=>{set_view_login(false);}} className="bg-teal-600 hover:bg-teal-800 text-white w-full py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                        Sign Up
                    </button>
                </div>
            </form>
        </div>
        <div className={ (view_login)?"hidden":"rounded-lg shadow-lg h-fit bg-gray-800 text-white min-w-fit text-sm"}>
            <form className="m-4 p-8" id="form-sign-up">
                <div className="border-b-2 pb-2 border-b-teal-600">
                    <div className="mb-4">
                        <label className="block text-sm mb-2" htmlFor="name">
                            Name
                        </label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Name" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm mb-2" htmlFor="email">
                            Email
                        </label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="example@sujankumal.com.np" />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm mb-2" htmlFor="password">
                            Password
                        </label>
                        <input className={`"shadow appearance-none border ${show_pass_error?'border-red-500':null} rounded w-full py-2 px-3 mb-3 leading-tight focus:outline-none focus:shadow-outline"`} id="password" type="password" placeholder="********" />
                        {show_pass_error?<p className="text-red-500 text-xs italic">Please choose a password.</p>:null}
                        
                    </div>
                    <div className="flex items-center justify-center">
                        <button onClick={()=>{}} className="bg-teal-600 hover:bg-teal-800 text-white w-full py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                            Sign Up
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <div className="block">Or</div>
                </div>
                <div className="flex items-center justify-center">
                    <button onClick={()=>{set_view_login(true);}} className="bg-teal-600 hover:bg-teal-800 text-white w-full py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                        Sign In
                    </button>
                </div>
            </form>
        </div>
    </div> );
}

export default LoginForms;