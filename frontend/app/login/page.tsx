'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { User, Lock, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(username, password);
            // Navigation is handled by AuthContext
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card
                    description="Sign in to access your security dashboard"
                    className="border-slate-700/50 shadow-2xl backdrop-blur-xl bg-slate-800/40"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            leftIcon={User}
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            leftIcon={Lock}
                        />

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                            Sign In
                        </Button>

                        <div className="text-center text-sm text-slate-400">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Register here
                            </Link>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
