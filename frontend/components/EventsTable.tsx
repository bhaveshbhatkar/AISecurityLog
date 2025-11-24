import type { Event } from '@/types/event';

export interface EventsTableProps {
    rows: Event[];
}

export default function EventsTable({ rows }: EventsTableProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow overflow-auto">
            <table className="w-full">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 text-left font-semibold text-gray-700">Time</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Src IP</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Dest IP</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Method</th>
                        <th className="p-3 text-left font-semibold text-gray-700">URL</th>
                        <th className="p-3 text-left font-semibold text-gray-700">User Agent</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Username</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Bytes</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Raw Line</th>
                        {/* <th className="p-3 text-left font-semibold text-gray-700">Upload ID</th> */}
                        <th className="p-3 text-left font-semibold text-gray-700">Anomalies</th>

                    </tr>
                </thead>
                <tbody className="text-gray-500">
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="p-8 text-center">
                                No events found
                            </td>
                        </tr>
                    ) : (
                        rows.map((r) => (
                            <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors">
                                <td className="p-3 text-sm">{r.timestamp || '-'}</td>
                                <td className="p-3 text-sm font-mono">{r.src_ip || '-'}</td>
                                <td className="p-3 text-sm font-mono">{r.dest_ip || '-'}</td>
                                <td className="p-3 text-sm font-mono">{r.method || '-'}</td>
                                <td className="p-3 text-sm max-w-md truncate" title={r.url}>
                                    {r.url || '-'}
                                </td>
                                <td className="p-3 text-sm max-w-md truncate" >
                                    {r.user_agent || '-'}
                                </td>
                                <td className="p-3 text-sm max-w-md truncate" >
                                    {r.username || '-'}
                                </td>
                                <td className="p-3 text-sm max-w-md truncate" >
                                    {r.status || '-'}
                                </td>
                                <td className="p-3 text-sm max-w-md truncate" >
                                    {r.bytes || '-'}
                                </td>

                                {/* <td className="p-3 text-sm max-w-md truncate" >
                                    {r.upload_id || '-'}
                                </td> */}
                                <td className="p-3 text-sm" >
                                    <div className="flex flex-wrap gap-1">
                                        {r.raw_line || '-'}
                                    </div>
                                </td>
                                <td className="p-3 text-sm">
                                    {r.anomalies?.length ? (
                                        <div className="flex flex-wrap gap-1">
                                            {r.anomalies.map((a, idx) => (
                                                <span
                                                    key={idx}
                                                    className=""
                                                >
                                                    {a.reason} ({a.score.toFixed(2)})
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
