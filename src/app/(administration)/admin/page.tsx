import { Metadata } from "next";
import { auth } from "../../../services/auth";
import { redirect } from "next/navigation";
import { CollapsibleSection, CollapsibleSectionGroup } from "../../../components/admin/CollapsibleSection";
import { LazyAdminTable } from "../../../components/admin/LazyAdminTable";

export const metadata: Metadata = {
    title: 'Admin | Sujan Kumal | Software Engineer',
    description: "Admin page.",
}

export const dynamic = 'force-dynamic';

async function Admin() {
    const session = await auth();
    if (!session?.user) {
        return redirect('/log-in');
    }
    if (!session.user.verified) {
        return redirect('/not-authorized');
    }

    return (
        <main className="min-h-screen bg-gray-50 rounded-2xl opacity-80">            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Database Management</h1>
                        <p className="text-sm text-gray-600">Manage your application data with full CRUD operations. Click on any section to expand and load the data.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href="/admin/firebase"
                            className="inline-flex w-fit items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
                        >
                            Manage Firebase
                        </a>
                        <a
                            href="/short-urls"
                            className="inline-flex w-fit items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Manage Short URLs
                        </a>
                    </div>
                </div>

                {/* Content Management */}
                <CollapsibleSectionGroup
                    title="📝 Content Management"
                    description="Manage posts, categories, and content blocks"
                    defaultExpanded={true}
                >
                    <div  className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CollapsibleSection
                        title="Posts"
                        entity="posts"
                        defaultExpanded={false}
                    >
                        <LazyAdminTable entity="posts" />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Categories"
                        entity="categories"
                    >
                        <LazyAdminTable entity="categories" />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Content Blocks"
                        entity="content"
                    >
                        <LazyAdminTable entity="content" />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Categories On Posts"
                        entity="categoriesonposts"
                    >
                        <LazyAdminTable entity="categoriesonposts" />
                    </CollapsibleSection>
                    </div>
                </CollapsibleSectionGroup>

                {/* User Management */}
                <CollapsibleSectionGroup
                    title="👥 User Management"
                    description="Manage users, profiles, and authentication"
                >
                    <div  className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CollapsibleSection
                        title="Users"
                        entity="user"
                    >
                        <LazyAdminTable entity="users" />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Profiles"
                        entity="profile"
                    >
                        <LazyAdminTable entity="profiles" />
                    </CollapsibleSection>
                    </div>
                </CollapsibleSectionGroup>

                {/* Site Management */}
                <CollapsibleSectionGroup
                    title="⚙️ Site Management"
                    description="Manage site settings, projects, and social links"
                >
                    <div  className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CollapsibleSection
                        title="Site Settings"
                        entity="site"
                    >
                        <LazyAdminTable entity="sites" />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Projects"
                        entity="project"
                    >
                        <LazyAdminTable entity="projects" />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Social Links"
                        entity="social"
                    >
                        <LazyAdminTable entity="socials" />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Updates"
                        entity="updates"
                    >
                        <LazyAdminTable entity="updates" />
                    </CollapsibleSection>
                    </div>
                </CollapsibleSectionGroup>

                {/* System Tables */}
                <CollapsibleSectionGroup
                    title="🔧 System Tables"
                    description="Authentication and system data (read-only)"
                >
                    <div  className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CollapsibleSection
                        title="Accounts"
                        entity="account"
                    >
                        <LazyAdminTable entity="accounts" isCRUD={false} />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Sessions"
                        entity="session"
                    >
                        <LazyAdminTable entity="sessions" isCRUD={false} />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Verification Tokens"
                        entity="verificationToken"
                    >
                        <LazyAdminTable entity="verificationtokens" isCRUD={false} />
                    </CollapsibleSection>
                    </div>
                </CollapsibleSectionGroup>
            </div>
        </main>
    );
}

export default Admin;
