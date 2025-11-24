'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface AnomalyData {
    time: Date;
    count: number;
    avgScore: number;
}

interface AnomalyTrendChartProps {
    data: AnomalyData[];
}

export default function AnomalyTrendChart({ data }: AnomalyTrendChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.length === 0) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 300;
        const margin = { top: 20, right: 60, bottom: 50, left: 60 };

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => d.time) as [Date, Date])
            .range([0, chartWidth]);

        const yCount = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 0])
            .nice()
            .range([chartHeight, 0]);

        const yScore = d3.scaleLinear()
            .domain([0, 1])
            .range([chartHeight, 0]);

        // Line generators
        const countLine = d3.line<AnomalyData>()
            .x(d => x(d.time))
            .y(d => yCount(d.count))
            .curve(d3.curveMonotoneX);

        const scoreLine = d3.line<AnomalyData>()
            .x(d => x(d.time))
            .y(d => yScore(d.avgScore))
            .curve(d3.curveMonotoneX);

        // Count line (red)
        g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 2.5)
            .attr('d', countLine);

        // Score line (orange)
        g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#f59e0b')
            .attr('stroke-width', 2.5)
            .attr('stroke-dasharray', '5,5')
            .attr('d', scoreLine);

        // Dots for count
        g.selectAll('.count-dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'count-dot')
            .attr('cx', d => x(d.time))
            .attr('cy', d => yCount(d.count))
            .attr('r', 4)
            .attr('fill', '#ef4444')
            .attr('stroke', '#7f1d1d')
            .attr('stroke-width', 2);

        // Dots for score
        g.selectAll('.score-dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'score-dot')
            .attr('cx', d => x(d.time))
            .attr('cy', d => yScore(d.avgScore))
            .attr('r', 4)
            .attr('fill', '#f59e0b')
            .attr('stroke', '#78350f')
            .attr('stroke-width', 2);

        // X Axis
        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x).ticks(6))
            .selectAll('text')
            .attr('fill', '#94a3b8')
            .style('font-size', '12px');

        g.selectAll('.domain, .tick line')
            .attr('stroke', '#475569');

        // Y Axis Left (Count)
        g.append('g')
            .call(d3.axisLeft(yCount).ticks(5))
            .selectAll('text')
            .attr('fill', '#ef4444')
            .style('font-size', '12px');

        g.selectAll('.domain, .tick line')
            .attr('stroke', '#475569');

        // Y Axis Right (Score)
        g.append('g')
            .attr('transform', `translate(${chartWidth}, 0)`)
            .call(d3.axisRight(yScore).ticks(5))
            .selectAll('text')
            .attr('fill', '#f59e0b')
            .style('font-size', '12px');

        // Grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.1)
            .call(d3.axisLeft(yCount)
                .ticks(5)
                .tickSize(-chartWidth)
                .tickFormat(() => '')
            )
            .selectAll('.tick line')
            .attr('stroke', '#94a3b8');

        // Legend
        const legend = svg.append('g')
            .attr('transform', `translate(${margin.left + 20}, ${margin.top})`);

        // Count legend
        legend.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 30)
            .attr('y2', 0)
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 2.5);

        legend.append('text')
            .attr('x', 35)
            .attr('y', 4)
            .attr('fill', '#94a3b8')
            .style('font-size', '12px')
            .text('Anomaly Count');

        // Score legend
        legend.append('line')
            .attr('x1', 150)
            .attr('y1', 0)
            .attr('x2', 180)
            .attr('y2', 0)
            .attr('stroke', '#f59e0b')
            .attr('stroke-width', 2.5)
            .attr('stroke-dasharray', '5,5');

        legend.append('text')
            .attr('x', 185)
            .attr('y', 4)
            .attr('fill', '#94a3b8')
            .style('font-size', '12px')
            .text('Avg Score');

    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
                <p>No anomaly data available</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef}></svg>
        </div>
    );
}
