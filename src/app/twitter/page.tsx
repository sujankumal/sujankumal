import Sidebar from "@/components/Sidebar";

function Twitter() {
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-between">
            <div className="mb-8 p-4 md:m-8 md:col-span-3">
            Twitter
            </div>
            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar/>
                </div>
            </aside>
        </main>
     );
}

export default Twitter;