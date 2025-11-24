'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { MethodData } from '@/lib/chartUtils';
import { getMethodColor } from '@/lib/chartUtils';

interface MethodDistributionChartProps {
    data: MethodData[];
}

export default function MethodDistributionChart({ data }: MethodDistributionChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.length === 0) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 400;
        const radius = Math.min(width, height) / 2 - 40;

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Pie generator
        const pie = d3.pie<MethodData>()
            .value(d => d.count)
            .sort(null);

        // Arc generator
        const arc: any = d3.arc<d3.PieArcDatum<MethodData>>()
            .innerRadius(radius * 0.5)
            .outerRadius(radius);

        const hoverArc: any = d3.arc<d3.PieArcDatum<MethodData>>()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 1.1);

        // Create slices
        const slices = g.selectAll('.slice')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'slice');

        // Add paths
        slices.append('path')
            .attr('d', arc)
            .attr('fill', d => getMethodColor(d.data.method))
            .attr('stroke', '#1e293b')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', hoverArc);

                tooltip
                    .style('display', 'block')
                    .html(`
                        <div class="font-semibold">${d.data.method}</div>
                        <div class="text-sm">${d.data.count} requests</div>
                        <div class="text-xs text-slate-400">${d.data.percentage.toFixed(1)}%</div>
                    `);
            })
            .on('mousemove', function (event) {
                tooltip
                    .style('left', `${event.offsetX + 10}px`)
                    .style('top', `${event.offsetY - 10}px`);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arc);

                tooltip.style('display', 'none');
            });

        // Add percentage labels for larger slices
        slices.filter(d => d.data.percentage > 5)
            .append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text(d => `${d.data.percentage.toFixed(0)}%`);

        // Center text
        const totalRequests = data.reduce((sum, d) => sum + d.count, 0);

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .attr('fill', '#e2e8f0')
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .text(totalRequests.toLocaleString());

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.2em')
            .attr('fill', '#94a3b8')
            .style('font-size', '12px')
            .text('Total Requests');

        // Legend
        const legend = svg.append('g')
            .attr('transform', `translate(20, 20)`);

        data.forEach((d, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 25})`);

            legendItem.append('rect')
                .attr('width', 14)
                .attr('height', 14)
                .attr('fill', getMethodColor(d.method))
                .attr('rx', 3);

            legendItem.append('text')
                .attr('x', 20)
                .attr('y', 11)
                .attr('fill', '#94a3b8')
                .style('font-size', '12px')
                .text(`${d.method} (${d.percentage.toFixed(1)}%)`);
        });

        // Tooltip
        const tooltip = d3.select(container)
            .append('div')
            .attr('class', 'absolute hidden bg-slate-800 text-white px-3 py-2 rounded-lg text-sm border border-slate-700 shadow-lg')
            .style('pointer-events', 'none');

        return () => {
            tooltip.remove();
        };

    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[400px] text-slate-500">
                <p>No method data available</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef}></svg>
        </div>
    );
}
