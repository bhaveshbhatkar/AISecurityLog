'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { User, Lock, AlertCircle, ArrowRight, Shield, UserPlus, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import api from '@/lib/api';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'analyst'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/register', formData);
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card
                    title="Create Account"
                    description="Join the security team"
                    className="border-slate-700/50 shadow-2xl backdrop-blur-xl bg-slate-800/40"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                name="first_name"
                                type="text"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Bhavesh"
                                required
                            />
                            <Input
                                label="Last Name"
                                name="last_name"
                                type="text"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Bhatkar"
                                required
                            />
                        </div>

                        <Input
                            label="Username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="bhatkar"
                            required
                            leftIcon={User}
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Test@1234"
                            required
                            leftIcon={Lock}
                        />

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300">Role</label>
                            <div className="relative">
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all appearance-none"
                                >
                                    <option value="analyst">Security Analyst</option>
                                    <option value="admin">Administrator</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                                <Shield className="absolute right-3 top-2.5 w-5 h-5 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

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
                            className="w-full mt-2"
                            isLoading={isLoading}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                            Register
                        </Button>

                        <div className="text-center text-sm text-slate-400 mt-4">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
