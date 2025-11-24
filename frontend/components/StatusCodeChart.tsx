'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { StatusData } from '@/lib/chartUtils';
import { getStatusColor } from '@/lib/chartUtils';

interface StatusCodeChartProps {
    data: StatusData[];
}

export default function StatusCodeChart({ data }: StatusCodeChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.length === 0) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 60, left: 60 };

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.status.toString()))
            .range([0, chartWidth])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 0])
            .nice()
            .range([chartHeight, 0]);

        // Bars
        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.status.toString()) || 0)
            .attr('y', chartHeight)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', d => getStatusColor(d.status))
            .attr('rx', 4)
            .transition()
            .duration(800)
            .attr('y', d => y(d.count))
            .attr('height', d => chartHeight - y(d.count));

        // Count Labels
        g.selectAll('.count-label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'count-label')
            .attr('x', d => (x(d.status.toString()) || 0) + x.bandwidth() / 2)
            .attr('y', d => y(d.count) - 8)
            .attr('text-anchor', 'middle')
            .attr('fill', '#e2e8f0')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(d => d.count);

        // X Axis
        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('fill', '#94a3b8')
            .style('font-size', '12px')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        g.selectAll('.domain, .tick line')
            .attr('stroke', '#475569');

        // Y Axis
        g.append('g')
            .call(d3.axisLeft(y).ticks(5))
            .selectAll('text')
            .attr('fill', '#94a3b8')
            .style('font-size', '12px');

        g.selectAll('.domain, .tick line')
            .attr('stroke', '#475569');

        // Grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.1)
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickSize(-chartWidth)
                .tickFormat(() => '')
            )
            .selectAll('.tick line')
            .attr('stroke', '#94a3b8');

        // Legend
        const categories = Array.from(new Set(data.map(d => d.category)));
        const legend = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${height - 30})`);

        categories.forEach((category, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(${i * 80}, 0)`);

            legendItem.append('rect')
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', getStatusColor(parseInt(category.replace('xx', '00'))))
                .attr('rx', 2);

            legendItem.append('text')
                .attr('x', 18)
                .attr('y', 10)
                .attr('fill', '#94a3b8')
                .style('font-size', '11px')
                .text(category);
        });

    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[400px] text-slate-500">
                <p>No status code data available</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef}></svg>
        </div>
    );
}
