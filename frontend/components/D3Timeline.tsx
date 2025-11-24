import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface D3TimelineProps {
    data: { time: string; count: number }[];
}

export default function D3Timeline({ data }: D3TimelineProps) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        const w = ref.current.clientWidth;
        const h = 120;
        d3.select(ref.current).selectAll('*').remove();
        const svg = d3.select(ref.current).append('svg').attr('width', w).attr('height', h);
        const times = data.map((d) => new Date(d.time));
        const x = d3
            .scaleTime()
            .domain(d3.extent(times) as [Date, Date])
            .range([40, w - 20]);
        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.count) || 1])
            .range([h - 20, 10]);
        const line = d3
            .line<{ time: string; count: number }>()
            .x((d) => x(new Date(d.time)))
            .y((d) => y(d.count));
        svg
            .append('path')
            .attr('d', line(data))
            .attr('fill', 'none')
            .attr('stroke', '#0366d6');
        svg
            .append('g')
            .attr('transform', `translate(0,${h - 20})`)
            .call(d3.axisBottom(x).ticks(4));
    }, [data]);

    return <div className="bg-white rounded-lg border border-gray-200 shadow" ref={ref} />;
}
