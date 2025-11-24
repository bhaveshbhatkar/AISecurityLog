import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import './globals.css';

export const metadata: Metadata = {
    title: 'Log Analysis Dashboard',
    description: 'AI-powered security log analysis and anomaly detection',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <AuthProvider>
                    <Navigation />
                    <main className="container mx-auto pt-20 min-h-screen">
                        {children}
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}
