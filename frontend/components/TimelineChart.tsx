'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { TimeSeriesData } from '@/lib/chartUtils';

interface TimelineChartProps {
    data: TimeSeriesData[];
}

export default function TimelineChart({ data }: TimelineChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.length === 0) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 50, left: 60 };

        // Clear previous content
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

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 0])
            .nice()
            .range([chartHeight, 0]);

        // Gradient
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'area-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0.8);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0.1);

        // Area
        const area = d3.area<TimeSeriesData>()
            .x(d => x(d.time))
            .y0(chartHeight)
            .y1(d => y(d.count))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(data)
            .attr('fill', 'url(#area-gradient)')
            .attr('d', area);

        // Line
        const line = d3.line<TimeSeriesData>()
            .x(d => x(d.time))
            .y(d => y(d.count))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 2)
            .attr('d', line);

        // X Axis
        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x).ticks(6))
            .selectAll('text')
            .attr('fill', '#94a3b8')
            .style('font-size', '12px');

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

        // Tooltip
        const tooltip = d3.select(container)
            .append('div')
            .attr('class', 'absolute hidden bg-slate-800 text-white px-3 py-2 rounded-lg text-sm border border-slate-700 shadow-lg')
            .style('pointer-events', 'none');

        // Dots with tooltip
        g.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(d.time))
            .attr('cy', d => y(d.count))
            .attr('r', 4)
            .attr('fill', '#3b82f6')
            .attr('stroke', '#1e40af')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 6);
                tooltip
                    .style('display', 'block')
                    .html(`
                        <div class="font-semibold">${d.time.toLocaleString()}</div>
                        <div class="text-blue-400">${d.count} events</div>
                    `);
            })
            .on('mousemove', function (event) {
                tooltip
                    .style('left', `${event.offsetX + 10}px`)
                    .style('top', `${event.offsetY - 10}px`);
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 4);
                tooltip.style('display', 'none');
            });

        return () => {
            tooltip.remove();
        };
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
                <p>No timeline data available</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef}></svg>
        </div>
    );
}
