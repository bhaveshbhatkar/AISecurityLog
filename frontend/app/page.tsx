'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import StatsCards from '@/components/StatsCards';
import TimelineChart from '@/components/TimelineChart';
import TopIPsChart from '@/components/TopIPsChart';
import StatusCodeChart from '@/components/StatusCodeChart';
import MethodDistributionChart from '@/components/MethodDistributionChart';
import AnomalyTrendChart from '@/components/AnomalyTrendChart';
import type { EventsResponse } from '@/types/event';
import { motion } from 'motion/react';
import {
    aggregateByTime,
    getTopIPs,
    groupByStatus,
    getMethodDistribution,
    countUnique
} from '@/lib/chartUtils';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function DashboardPage() {
    const { data: eventsData, error: eventsError } = useSWR<EventsResponse>(
        '/events?page=1&perPage=5000',
        fetcher,
        { refreshInterval: 5000 }
    );

    const events = eventsData?.events || [];

    // Process data for charts
    const chartData = useMemo(() => {
        if (!events.length) {
            return {
                timeline: [],
                topIPs: [],
                statusCodes: [],
                methods: [],
                anomalies: [],
                stats: {
                    totalEvents: 0,
                    totalAnomalies: 0,
                    uniqueIPs: 0,
                    avgRequestsPerMinute: 0
                }
            };
        }

        // Timeline data (hourly aggregation)
        const timeline = aggregateByTime(events, 60);

        // Top IPs
        const topIPs = getTopIPs(events, 10);

        // Status codes
        const statusCodes = groupByStatus(events);

        // HTTP methods
        const methods = getMethodDistribution(events);

        // Anomaly trends
        const eventsWithAnomalies = events.filter(e => e.anomalies && e.anomalies.length > 0);
        const anomalyBuckets = new Map<string, { count: number; scores: number[] }>();

        eventsWithAnomalies.forEach(event => {
            if (!event.timestamp || !event.anomalies) return;

            const date = new Date(event.timestamp);
            const roundedTime = new Date(
                Math.floor(date.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000)
            );
            const key = roundedTime.toISOString();

            if (!anomalyBuckets.has(key)) {
                anomalyBuckets.set(key, { count: 0, scores: [] });
            }

            const bucket = anomalyBuckets.get(key)!;
            event.anomalies.forEach(anomaly => {
                bucket.count++;
                bucket.scores.push(parseFloat(anomaly.score.toString()));
            });
        });

        const anomalies = Array.from(anomalyBuckets.entries())
            .map(([time, data]) => ({
                time: new Date(time),
                count: data.count,
                avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length
            }))
            .sort((a, b) => a.time.getTime() - b.time.getTime());

        // Calculate stats
        const totalAnomalies = events.reduce((sum, e) => sum + (e.anomalies?.length || 0), 0);
        const uniqueIPs = countUnique(events.map(e => e.src_ip));

        // Calculate avg requests per minute
        const timestamps = events.map(e => e.timestamp).filter(t => t) as string[];
        let avgRequestsPerMinute = 0;
        if (timestamps.length > 1) {
            const times = timestamps.map(t => new Date(t).getTime());
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            const durationMinutes = (maxTime - minTime) / (1000 * 60);
            avgRequestsPerMinute = durationMinutes > 0 ? Math.round(events.length / durationMinutes) : 0;
        }

        return {
            timeline,
            topIPs,
            statusCodes,
            methods,
            anomalies,
            stats: {
                totalEvents: events.length,
                totalAnomalies,
                uniqueIPs,
                avgRequestsPerMinute
            }
        };
    }, [events]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (eventsError) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-400 text-lg">Error loading dashboard data</p>
                    <p className="text-slate-500 mt-2">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Events Dashboard</h1>
                    <p className="text-slate-400 mt-1">Real-time monitoring and analysis</p>
                </div>
            </div>

            {/* Stats Cards */}
            <motion.div variants={itemVariants}>
                <StatsCards {...chartData.stats} />
            </motion.div>

            {/* Timeline Chart */}
            <motion.div variants={itemVariants}>
                <Card title="Event Timeline" description="Request volume over time">
                    <TimelineChart data={chartData.timeline} />
                </Card>
            </motion.div>

            {/* Top IPs and Status Codes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                    <Card title="Top IP Addresses" description="Most active sources">
                        <TopIPsChart data={chartData.topIPs} />
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card title="HTTP Status Codes" description="Response status distribution">
                        <StatusCodeChart data={chartData.statusCodes} />
                    </Card>
                </motion.div>
            </div>

            {/* Method Distribution and Anomaly Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                    <Card title="HTTP Methods" description="Request method distribution">
                        <MethodDistributionChart data={chartData.methods} />
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card title="Anomaly Trends" description="Detected anomalies over time">
                        <AnomalyTrendChart data={chartData.anomalies} />
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
