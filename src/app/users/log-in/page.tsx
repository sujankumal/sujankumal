import { Metadata } from "next";
import LoginForms from "./form";

export const metadata: Metadata = {
    title: 'Login | Er. Sujan Kumal | A Software Engineer',
    description: "Login page for user.",
    openGraph: {
        images: ['/bird-1024x576-20.gif'],
        type: 'website',
        url: 'https://vercel.sujankumal.com.np/',
        siteName: 'Er. Sujan Kumal | A Software Engineer',
        title: 'Login | Er. Sujan Kumal | A Software Engineer',
        description: "Login page for user.",
    },
    twitter: {
        card: 'summary_large_image',
        creator: '@sujan_03_',
        site: '@sujan_03_',
        images: ['/bird-1024x576-20.gif'],
        title: 'Login | Er. Sujan Kumal | A Software Engineer',
        description: "Login page for user.",
    },
}

export const revalidate = 10;
function Login() {
    let view_login = true;
    return (
    <main className="p-4 w-full inline-flex justify-center">
        <LoginForms/>
    </main>
    );
}

export default Login;