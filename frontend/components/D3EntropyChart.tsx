import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface D3EntropyChartProps {
    data: { timestamp: string; entropy: number }[];
}

export default function D3EntropyChart({ data }: D3EntropyChartProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const w = 500;
        const h = 180;
        d3.select(ref.current).selectAll('*').remove();
        const svg = d3.select(ref.current).append('svg').attr('width', w).attr('height', h);
        const x = d3
            .scaleTime()
            .domain(d3.extent(data, (d) => new Date(d.timestamp)) as [Date, Date])
            .range([40, w - 20]);
        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.entropy) || 1])
            .range([h - 20, 10]);
        const line = d3
            .line<{ timestamp: string; entropy: number }>()
            .x((d) => x(new Date(d.timestamp)))
            .y((d) => y(d.entropy));
        svg
            .append('path')
            .attr('d', line(data))
            .attr('fill', 'none')
            .attr('stroke', '#2563eb')
            .attr('stroke-width', 2);
        svg
            .append('g')
            .attr('transform', `translate(0,${h - 20})`)
            .call(d3.axisBottom(x).ticks(4));
    }, [data]);

    return <div ref={ref} className="bg-white rounded-lg border border-gray-200 p-4 shadow" />;
}
