"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SignOutButton from "@/components/auth/SignOut";
import { SiteType } from "@/types/site";

export default function AdminNav({ session, sites }: { session: any, sites: SiteType }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="w-full sticky top-0 z-50 text-white">
            {/* Navbar */}
            <nav className="backdrop-blur-lg bg-black/30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                    {/* Logo Section */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-3">
                            <Image src="/bird-100x100-20.gif" alt="Logo" width={50} height={50} unoptimized />
                            <div className="hidden sm:block">
                                <div className="uppercase font-bold text-sm hover:text-orange-500 transition-colors">
                                    {sites.name}
                                </div>
                                <div className="text-light text-xs">{sites.motto}</div>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/admin" className="text-sm font-medium hover:text-orange-500 transition-colors">Admin</Link>
                        <Link href="/admin/firebase" className="text-sm font-medium hover:text-orange-500 transition-colors">Firebase</Link>
                        <Link href="/short-urls" className="text-sm font-medium hover:text-orange-500 transition-colors">Short URLs</Link>

                        {/* User Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
                            >
                                {imgError || !session?.user?.image ? (
                                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                        <User size={18} className="text-zinc-400" />
                                    </div>
                                ) : (
                                    <Image
                                        src={session.user.image}
                                        className="w-8 h-8 rounded-full"
                                        alt="User"
                                        width={50}
                                        height={50}
                                        onError={() => setImgError(true)}
                                    />
                                )}<span className="text-sm">{session?.user?.name}</span>
                                <ChevronDown size={16} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 top-12 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl p-2 z-50">
                                    <Link href="/profile" className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg text-sm">
                                        <Settings size={16} /> Profile
                                    </Link>
                                    <div className="border-t border-white/10 my-1" />
                                    <SignOutButton className="text-sm flex w-full items-center gap-2 p-2 hover:bg-red-500/10 rounded-lg cursor-pointer " />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Toggle Button */}
                    <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden p-2 bg-zinc-900 border-b border-white/10">
                        <Link href="/admin" className="block p-2">Admin</Link>
                        <Link href="/admin/firebase" className="block p-2">Firebase</Link>
                        <Link href="/short-urls" className="block p-2">Short URLs</Link>
                        <Link href="/profile" className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg text-sm">
                            <Settings size={16} /> Profile
                        </Link>
                        <div className="border-t border-white/10">
                            <SignOutButton className="text-sm flex w-full items-center gap-2 p-2 hover:bg-red-500/10 rounded-lg cursor-pointer" />
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
}