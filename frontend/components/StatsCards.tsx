'use client';

import { Activity, AlertTriangle, Globe, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface StatsCardsProps {
    totalEvents: number;
    totalAnomalies: number;
    uniqueIPs: number;
    avgRequestsPerMinute: number;
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    suffix?: string;
}

function StatCard({ title, value, icon, color, suffix = '' }: StatCardProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 1000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium">{title}</p>
                    <p className={`text-3xl font-bold mt-2 ${color}`}>
                        {displayValue.toLocaleString()}{suffix}
                    </p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color === 'text-blue-400' ? 'from-blue-500/20 to-blue-600/20' : color === 'text-red-400' ? 'from-red-500/20 to-red-600/20' : color === 'text-purple-400' ? 'from-purple-500/20 to-purple-600/20' : 'from-green-500/20 to-green-600/20'} flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

export default function StatsCards({ totalEvents, totalAnomalies, uniqueIPs, avgRequestsPerMinute }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Total Events"
                value={totalEvents}
                icon={<Activity className="w-6 h-6 text-blue-400" />}
                color="text-blue-400"
            />
            <StatCard
                title="Anomalies Detected"
                value={totalAnomalies}
                icon={<AlertTriangle className="w-6 h-6 text-red-400" />}
                color="text-red-400"
            />
            <StatCard
                title="Unique IP Addresses"
                value={uniqueIPs}
                icon={<Globe className="w-6 h-6 text-purple-400" />}
                color="text-purple-400"
            />
            <StatCard
                title="Avg Requests/Min"
                value={avgRequestsPerMinute}
                icon={<TrendingUp className="w-6 h-6 text-green-400" />}
                color="text-green-400"
            />
        </div>
    );
}
