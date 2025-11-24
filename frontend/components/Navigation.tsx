'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { LayoutDashboard, Upload, Activity, FileText, Search, LogOut, Menu, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navigation() {
    const pathname = usePathname();
    const { isAuthenticated, logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (!isAuthenticated) {
        return null;
    }

    const navLinks = [
        { href: '/uploads', label: 'Uploads', icon: <Upload className="w-5 h-5" /> },
        { href: '/events', label: 'Events', icon: <Activity className="w-5 h-5" /> },
        // { href: '/anomalies', label: 'Anomalies', icon: <FileText className="w-5 h-5" /> },
        { href: '/query', label: 'Query', icon: <Search className="w-5 h-5" /> },
        { href: '/', label: 'Charts', icon: <LayoutDashboard className="w-5 h-5" /> },
    ];

    return (
        <nav className="fixed top-0 w-full z-50 glass border-b border-slate-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                AISecurityLog
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
                                {navLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${isActive
                                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            <span>{link.icon}</span>
                                            <span>{link.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* User Section */}
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6 space-x-4">
                            {user && (
                                <div className="flex items-center space-x-3 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                        {user.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">{user.username}</span>
                                </div>
                            )}
                            <button
                                onClick={logout}
                                className="text-slate-400 hover:text-white transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMobileMenuOpen ? (
                                <Menu className="block h-6 w-6" />
                            ) : (
                                <X className="block h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass border-t border-slate-700/50 overflow-hidden"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`block px-3 py-2 rounded-md text-base font-medium ${isActive
                                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span>{link.icon}</span>
                                            <span>{link.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                            <div className="pt-4 pb-3 border-t border-slate-700">
                                <div className="flex items-center px-5">
                                    {user && (
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                                {user.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        </div>
                                    )}
                                    <div className="ml-3">
                                        <div className="text-base font-medium leading-none text-white">{user?.username}</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="ml-auto bg-slate-800 flex-shrink-0 p-1 rounded-full text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                                    >
                                        <span className="sr-only">Logout</span>
                                        <LogOut className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
