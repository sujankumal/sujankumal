import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Admin | Er. Sujan Kumal | A Software Engineer',
    description: "Admin page.",
}

export const revalidate = 10;
function Admin() {
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 p-4 md:m-8 md:col-span-3 inline-flex justify-center">
                <div className="text-lg">Admin</div>
            </div>
        </main>
     );
}

export default Admin;