'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { IPData } from '@/lib/chartUtils';

interface TopIPsChartProps {
    data: IPData[];
}

export default function TopIPsChart({ data }: TopIPsChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.length === 0) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 30, left: 120 };

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 0])
            .nice()
            .range([0, chartWidth]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.ip))
            .range([0, chartHeight])
            .padding(0.2);

        // Color scale
        const colorScale = d3.scaleLinear<string>()
            .domain([0, data.length - 1])
            .range(['#3b82f6', '#8b5cf6']);

        // Bars
        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => y(d.ip) || 0)
            .attr('width', 0)
            .attr('height', y.bandwidth())
            .attr('fill', (d, i) => colorScale(i))
            .attr('rx', 4)
            .transition()
            .duration(800)
            .attr('width', d => x(d.count));

        // IP Labels
        g.selectAll('.ip-label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'ip-label')
            .attr('x', -10)
            .attr('y', d => (y(d.ip) || 0) + y.bandwidth() / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#94a3b8')
            .style('font-size', '12px')
            .style('font-family', 'monospace')
            .text(d => d.ip);

        // Count Labels
        g.selectAll('.count-label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'count-label')
            .attr('x', d => x(d.count) + 8)
            .attr('y', d => (y(d.ip) || 0) + y.bandwidth() / 2)
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#e2e8f0')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(d => d.count.toLocaleString());

        // X Axis
        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x).ticks(5))
            .selectAll('text')
            .attr('fill', '#94a3b8')
            .style('font-size', '11px');

        g.selectAll('.domain, .tick line')
            .attr('stroke', '#475569');

    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[400px] text-slate-500">
                <p>No IP data available</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef}></svg>
        </div>
    );
}
