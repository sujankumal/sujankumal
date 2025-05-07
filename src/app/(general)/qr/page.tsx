import QR from "@/components/QR/qr";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'QR | Sujan Kumal | A Software Engineer',
    description: "QR generator is a web application that allows users to create QR codes for various purposes, such as sharing links, contact information, and more. It is designed to be user-friendly and efficient, making it easy for anyone to generate QR codes quickly.",
    openGraph:{
        images:['/bird-1024x576-20.gif'],
        type:'website',
        url:'https://sujankumal.com.np/',
        siteName:'Sujan Kumal | A Software Engineer',
        title: 'QR | Sujan Kumal | A Software Engineer',
        description: "QR generator is a web application that allows users to create QR codes for various purposes, such as sharing links, contact information, and more. It is designed to be user-friendly and efficient, making it easy for anyone to generate QR codes quickly.",
    },
    twitter:{
        card:'summary',
        creator:'@sujan_03_',
        site:'@sujan_03_',
        images:['/bird-1024x576-20.gif'],
        title: 'QR | Sujan Kumal | A Software Engineer',
        description: "QR generator is a web application that allows users to create QR codes for various purposes, such as sharing links, contact information, and more. It is designed to be user-friendly and efficient, making it easy for anyone to generate QR codes quickly.",
    },
    robots: {
      index: true,
      follow: true,
    },
}

export default function Page() {
    return <QR />;  
}