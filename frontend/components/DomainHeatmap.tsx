interface DomainHeatmapProps {
    rows: { domain: string; score: number }[];
}

export default function DomainHeatmap({ rows }: DomainHeatmapProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Domain Reputation Heatmap</h3>
            <div className="grid grid-cols-6 gap-2">
                {rows.map((r, i) => (
                    <div
                        key={i}
                        className="p-2 text-center rounded text-white text-sm"
                        style={{ background: `rgba(220,38,38,${r.score})` }}
                        title={`${r.domain}: ${r.score}`}
                    >
                        {r.domain}
                    </div>
                ))}
            </div>
        </div>
    );
}
