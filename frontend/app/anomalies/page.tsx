'use client';

import useSWR from 'swr';
import api from '@/lib/api';
import type { AnomaliesResponse, Anomaly } from '@/types/event';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function AnomaliesPage() {
    const { data, error } = useSWR<AnomaliesResponse>('/anomalies?page=1&perPage=500', fetcher);
    const anomalies: Anomaly[] = data?.anomalies || [];

    return (
        <div className="p-4">
            <h3 className="text-2xl font-semibold mb-4">Anomalies</h3>
            <div className="bg-white border rounded-lg overflow-hidden shadow">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left font-semibold text-gray-700">Event ID</th>
                            <th className="p-3 text-left font-semibold text-gray-700">Detector</th>
                            <th className="p-3 text-left font-semibold text-gray-700">Score</th>
                            <th className="p-3 text-left font-semibold text-gray-700">Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {anomalies.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No anomalies found
                                </td>
                            </tr>
                        ) : (
                            anomalies.map((a) => (
                                <tr key={a.id} className="border-t hover:bg-gray-50 transition-colors text-gray-500">
                                    <td className="p-3">{a.event_id}</td>
                                    <td className="p-3">{a.detector}</td>
                                    <td className="p-3">
                                        <span
                                            className={`inline-block px-2 py-1 rounded text-sm font-semibold ${a.score > 0.7
                                                ? 'bg-red-100 text-red-800'
                                                : a.score > 0.4
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}
                                        >
                                            {a.score.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="p-3">{a.reason}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
