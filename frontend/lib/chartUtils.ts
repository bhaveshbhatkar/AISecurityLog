import type { Event } from '@/types/event';

export interface TimeSeriesData {
    time: Date;
    count: number;
}

export interface IPData {
    ip: string;
    count: number;
}

export interface StatusData {
    status: number;
    count: number;
    category: string;
}

export interface MethodData {
    method: string;
    count: number;
    percentage: number;
}

/**
 * Aggregate events by time intervals
 */
export function aggregateByTime(events: Event[], intervalMinutes: number = 60): TimeSeriesData[] {
    if (!events.length) return [];

    const buckets = new Map<string, number>();

    events.forEach(event => {
        if (!event.timestamp) return;

        const date = new Date(event.timestamp);
        const roundedTime = new Date(
            Math.floor(date.getTime() / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000)
        );
        const key = roundedTime.toISOString();

        buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    return Array.from(buckets.entries())
        .map(([time, count]) => ({ time: new Date(time), count }))
        .sort((a, b) => a.time.getTime() - b.time.getTime());
}

/**
 * Get top N IP addresses by request count
 */
export function getTopIPs(events: Event[], limit: number = 10): IPData[] {
    const ipCounts = new Map<string, number>();

    events.forEach(event => {
        const ip = event.src_ip || 'Unknown';
        ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    });

    return Array.from(ipCounts.entries())
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

/**
 * Group events by HTTP status code
 */
export function groupByStatus(events: Event[]): StatusData[] {
    const statusCounts = new Map<number, number>();

    events.forEach(event => {
        if (event.status) {
            statusCounts.set(event.status, (statusCounts.get(event.status) || 0) + 1);
        }
    });

    return Array.from(statusCounts.entries())
        .map(([status, count]) => ({
            status,
            count,
            category: getStatusCategory(status)
        }))
        .sort((a, b) => a.status - b.status);
}

/**
 * Calculate HTTP method distribution
 */
export function getMethodDistribution(events: Event[]): MethodData[] {
    const methodCounts = new Map<string, number>();
    let total = 0;

    events.forEach(event => {
        const method = event.method || 'Unknown';
        methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
        total++;
    });

    return Array.from(methodCounts.entries())
        .map(([method, count]) => ({
            method,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Get status code category (2xx, 3xx, 4xx, 5xx)
 */
export function getStatusCategory(code: number): string {
    if (code >= 200 && code < 300) return '2xx';
    if (code >= 300 && code < 400) return '3xx';
    if (code >= 400 && code < 500) return '4xx';
    if (code >= 500 && code < 600) return '5xx';
    return 'Other';
}

/**
 * Get color for status code
 */
export function getStatusColor(code: number): string {
    if (code >= 200 && code < 300) return '#10b981'; // green
    if (code >= 300 && code < 400) return '#3b82f6'; // blue
    if (code >= 400 && code < 500) return '#f59e0b'; // yellow
    if (code >= 500 && code < 600) return '#ef4444'; // red
    return '#6b7280'; // gray
}

/**
 * Get color for HTTP method
 */
export function getMethodColor(method: string): string {
    const colors: Record<string, string> = {
        'GET': '#3b82f6',
        'POST': '#10b981',
        'PUT': '#f59e0b',
        'DELETE': '#ef4444',
        'PATCH': '#8b5cf6',
        'HEAD': '#06b6d4',
        'OPTIONS': '#ec4899',
    };
    return colors[method.toUpperCase()] || '#6b7280';
}

/**
 * Format date for chart labels
 */
export function formatChartDate(date: Date): string {
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 168) { // 7 days
        return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

/**
 * Count unique values in array
 */
export function countUnique(values: (string | undefined)[]): number {
    return new Set(values.filter(v => v !== undefined)).size;
}
