import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Login | Er. Sujan Kumal | A Software Engineer',
    description: "Login page for user.",
    openGraph:{
        images:['/bird-1024x576-20.gif'],
        type:'website',
        url:'https://vercel.sujankumal.com.np/',
        siteName:'Er. Sujan Kumal | A Software Engineer',
        title: 'Login | Er. Sujan Kumal | A Software Engineer',
        description: "Login page for user.",
    },
    twitter:{
        card:'summary_large_image',
        creator:'@sujan_03_',
        site:'@sujan_03_',
        images:['/bird-1024x576-20.gif'],
        title: 'Login | Er. Sujan Kumal | A Software Engineer',
        description: "Login page for user.",
    },
}

function Login() {
    
    return (
        <main className="min-h-screen justify-center">
            <div className="mb-8 p-4 md:m-8 inline-flex justify-center">
                <div className="text-lg">Login</div>
            </div>
        </main>
     );
}

export default Login;