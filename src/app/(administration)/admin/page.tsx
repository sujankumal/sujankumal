import { Metadata } from "next";
import { auth, signOut } from "../../../services/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOut";
import Image from "next/image";
import bird_100_100_20 from '/public/bird-100x100-20.gif';
import { CollapsibleSection, CollapsibleSectionGroup } from "../../../components/admin/CollapsibleSection";
import { LazyAdminTable } from "../../../components/admin/LazyAdminTable";

export const metadata: Metadata = {
    title: 'Admin | Sujan Kumal | Software Engineer',
    description: "Admin page.",
}

export const revalidate = 86400;
async function Admin() {
    const session = await auth();
    if (!session?.user) {
        return redirect('/log-in');
    }
    if (!session.user.verified) {
        return redirect('/not-authorized');
    }

    return (
        <main className="min-h-screen bg-gray-50">
            {/* ...existing navbar code... */}
            <nav className="bg-white border-b-2 border-gray-200 dark:bg-gray-900">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-1">
                    {/* ...existing navbar content... */}
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Management</h1>
                    <p className="text-gray-600">Manage your application data with full CRUD operations. Click on any section to expand and load the data.</p>
                </div>

                {/* Content Management */}
                <CollapsibleSectionGroup
                    title="📝 Content Management"
                    description="Manage posts, categories, and content blocks"
                    defaultExpanded={true}
                >
                    <CollapsibleSection
                        title="Posts"
                        entity="post"
                        defaultExpanded={false}
                    >
                        <LazyAdminTable
                            title="Posts"
                            entity="post"
                            fields={["id","title","description","main_image","date","published","author"]}
                            markdownFields={["description"]}
                            imageFields={["main_image"]}
                            searchableFields={["title","description"]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Categories"
                        entity="category"
                    >
                        <LazyAdminTable
                            title="Categories"
                            entity="category"
                            fields={["id","name"]}
                            searchableFields={["name"]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Content Blocks"
                        entity="content"
                    >
                        <LazyAdminTable
                            title="Content"
                            entity="content"
                            fields={["id","type","content","sequence","postId","post"]}
                            markdownFields={["content"]}
                            searchableFields={["type","content"]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Categories On Posts"
                        entity="categoriesOnPosts"
                    >
                        <LazyAdminTable
                            title="Categories On Posts"
                            entity="categoriesOnPosts"
                            fields={["id","postId","categoryId","post","category"]}
                            searchableFields={[]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>
                </CollapsibleSectionGroup>

                {/* User Management */}
                <CollapsibleSectionGroup
                    title="👥 User Management"
                    description="Manage users, profiles, and authentication"
                >
                    <CollapsibleSection
                        title="Users"
                        entity="user"
                    >
                        <LazyAdminTable
                            title="Users"
                            entity="user"
                            fields={["id","name","email","verified","image"]}
                            imageFields={["image"]}
                            searchableFields={["name","email"]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Profiles"
                        entity="profile"
                    >
                        <LazyAdminTable
                            title="Profiles"
                            entity="profile"
                            fields={["id","authorId","status","image","about","phone","email","author"]}
                            markdownFields={["about"]}
                            imageFields={["image"]}
                            searchableFields={["email","phone"]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>
                </CollapsibleSectionGroup>

                {/* Site Management */}
                <CollapsibleSectionGroup
                    title="⚙️ Site Management"
                    description="Manage site settings, projects, and social links"
                >
                    <CollapsibleSection
                        title="Site Settings"
                        entity="site"
                    >
                        <LazyAdminTable
                            title="Site"
                            entity="site"
                            fields={["id","header_image","title","name","motto","greeting","description","year","contact_email"]}
                            markdownFields={["description","detail","privacy_policy"]}
                            imageFields={["header_image"]}
                            searchableFields={["title","name","motto","greeting"]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Projects"
                        entity="project"
                    >
                        <LazyAdminTable
                            title="Projects"
                            entity="project"
                            fields={["id","title","description","link"]}
                            markdownFields={["description"]}
                            searchableFields={["title","description"]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Social Links"
                        entity="social"
                    >
                        <LazyAdminTable
                            title="Socials"
                            entity="social"
                            fields={["id","name","username","embed"]}
                            searchableFields={["name","username"]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Updates"
                        entity="updates"
                    >
                        <LazyAdminTable
                            title="Updates"
                            entity="updates"
                            fields={["id","title","update","date"]}
                            markdownFields={["update"]}
                            searchableFields={["title","update"]}
                            isCRUD={true}
                        />
                    </CollapsibleSection>
                </CollapsibleSectionGroup>

                {/* System Tables */}
                <CollapsibleSectionGroup
                    title="🔧 System Tables"
                    description="Authentication and system data (read-only)"
                >
                    <CollapsibleSection
                        title="Accounts"
                        entity="account"
                    >
                        <LazyAdminTable
                            title="Accounts"
                            entity="account"
                            fields={["id","userId","type","provider","providerAccountId"]}
                            isCRUD={false}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Sessions"
                        entity="session"
                    >
                        <LazyAdminTable
                            title="Sessions"
                            entity="session"
                            fields={["id","sessionToken","userId","expires"]}
                            isCRUD={false}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Verification Tokens"
                        entity="verificationToken"
                    >
                        <LazyAdminTable
                            title="Verification Tokens"
                            entity="verificationToken"
                            fields={["identifier","token","expires"]}
                            isCRUD={false}
                        />
                    </CollapsibleSection>
                </CollapsibleSectionGroup>
            </div>
        </main>
    );
}

export default Admin;