'use client'

import { useZakatStore } from '@/store/zakatStore'
import { ASNAF_CATEGORIES } from '@/store/modules/distribution'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

// This component is currently not in use, but kept for future reference
export function DistributionVisualization() {
    const { allocations, getBreakdown, currency } = useZakatStore()

    // Get breakdown and calculate total zakat
    const breakdown = getBreakdown()
    const totalZakat = breakdown.combined.zakatDue

    // Calculate total allocated and remaining amounts
    const totalAllocated = Object.values(allocations).reduce(
        (sum, allocation) => sum + allocation.amount,
        0
    )
    const remaining = totalZakat - totalAllocated

    // If no allocations yet, show a message
    if (totalAllocated === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <p className="text-gray-500 mb-2">No allocations yet</p>
                <p className="text-sm text-gray-400">
                    Allocate your Zakat to recipient categories to see the distribution
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <p className="text-gray-500">Visualization temporarily disabled</p>
        </div>
    )
}

/* 
// Pie chart implementation - commented out for future use
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

// Custom tooltip component for the pie chart
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-2 border border-gray-100 shadow-sm rounded-md text-xs">
                <p className="font-medium">{data.name}</p>
                <p>{formatCurrency(data.value, 'USD')}</p>
                <p>{data.percentage.toFixed(1)}%</p>
            </div>
        );
    }
    return null;
};

export function PieChartVisualization() {
    const { allocations, getBreakdown, currency } = useZakatStore()

    // Get breakdown and calculate total zakat
    const breakdown = getBreakdown()
    const totalZakat = breakdown.combined.zakatDue

    // Calculate total allocated and remaining amounts
    const totalAllocated = Object.values(allocations).reduce(
        (sum, allocation) => sum + allocation.amount,
        0
    )
    const remaining = totalZakat - totalAllocated

    // Prepare data for pie chart
    const pieData = ASNAF_CATEGORIES
        .filter(category => allocations[category.id].amount > 0)
        .map(category => ({
            id: category.id,
            name: category.name,
            value: allocations[category.id].amount,
            percentage: (allocations[category.id].amount / totalZakat) * 100,
            color: category.color
        }))

    // Add unallocated if there is any
    if (remaining > 0) {
        pieData.push({
            id: 'unallocated',
            name: 'Unallocated',
            value: remaining,
            percentage: (remaining / totalZakat) * 100,
            color: '#F1F5F9'
        })
    }

    // If no allocations yet, show a message
    if (pieData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <p className="text-gray-500 mb-2">No allocations yet</p>
                <p className="text-sm text-gray-400">
                    Allocate your Zakat to recipient categories to see the distribution
                </p>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-64"
        >
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={1}
                        dataKey="value"
                        animationDuration={500}
                        animationBegin={0}
                    >
                        {pieData.map((entry) => (
                            <Cell key={entry.id} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
        </motion.div>
    )
}
*/

/* 
// Original Sankey diagram implementation - commented out for future use
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey'

// Define custom node and link types
interface SankeyNodeExtended extends SankeyNode<any, any> {
    name: string;
    color?: string;
}

interface SankeyLinkExtended extends SankeyLink<any, any> {
    source: SankeyNodeExtended;
    target: SankeyNodeExtended;
}

export function SankeyVisualization() {
    const { allocations, getBreakdown, currency } = useZakatStore()
    const [error, setError] = useState<string | null>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const chartInitializedRef = useRef<boolean>(false)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    // Memoize breakdown and derived values to prevent unnecessary recalculations
    const breakdown = useMemo(() => getBreakdown(), [getBreakdown]);
    const totalZakat = useMemo(() => breakdown.combined.zakatDue, [breakdown]);

    // Memoize allocated and remaining amounts
    const { totalAllocated, remaining, allocatedPercentage, remainingPercentage } = useMemo(() => {
        const totalAllocated = Object.values(allocations).reduce(
            (sum, allocation) => sum + allocation.amount,
            0
        );
        const remaining = totalZakat - totalAllocated;
        const allocatedPercentage = totalZakat > 0 ? (totalAllocated / totalZakat) * 100 : 0;
        const remainingPercentage = totalZakat > 0 ? (remaining / totalZakat) * 100 : 0;

        return { totalAllocated, remaining, allocatedPercentage, remainingPercentage };
    }, [allocations, totalZakat]);

    // Function to lighten a color - memoized to prevent recreation
    const lightenColor = useCallback((color: string, opacity: number = 0.5): string => {
        // For hex colors
        if (color.startsWith('#')) {
            // Convert hex to RGB
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            // Lighten by mixing with white
            const lightenedR = Math.round(r + (255 - r) * (1 - opacity));
            const lightenedG = Math.round(g + (255 - g) * (1 - opacity));
            const lightenedB = Math.round(b + (255 - b) * (1 - opacity));

            // Convert back to hex
            return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
        }

        // For named colors or other formats, use opacity
        return color;
    }, []);

    // Function to position tooltip correctly - memoized
    const positionTooltip = useCallback((event: MouseEvent, tooltip: HTMLDivElement) => {
        // Set tooltip content width to a fixed value for consistency
        tooltip.style.width = '220px';

        const tooltipWidth = 220; // Fixed width
        const tooltipHeight = tooltip.offsetHeight;

        // Calculate position relative to the viewport
        let left = event.clientX + 15;
        let top = event.clientY;

        // Adjust if tooltip would go off the right edge of the screen
        if (left + tooltipWidth > window.innerWidth - 20) {
            left = event.clientX - tooltipWidth - 15;
        }

        // Adjust if tooltip would go off the bottom edge of the screen
        if (top + tooltipHeight > window.innerHeight - 20) {
            top = event.clientY - tooltipHeight;
        }

        // Set position relative to the page
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }, []);

    // Memoize the allocated categories to prevent unnecessary filtering
    const allocatedCategories = useMemo(() =>
        ASNAF_CATEGORIES.filter(category => allocations[category.id].amount > 0),
        [allocations]
    );

    // Update dimensions on mount and window resize
    useEffect(() => {
        if (!containerRef.current) return;

        // Function to update dimensions
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        // Initial update
        updateDimensions();

        // Add resize listener
        window.addEventListener('resize', updateDimensions);

        // Clean up
        return () => {
            window.removeEventListener('resize', updateDimensions);
        };
    }, []);

    // Create and update the Sankey diagram
    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0) return;

        setError(null);

        try {
            // Check if we have data to display
            if (totalZakat <= 0) {
                setError("No Zakat due calculated yet");
                d3.select(svgRef.current).selectAll('*').remove();
                chartInitializedRef.current = false;
                return;
            }

            if (allocatedCategories.length === 0) {
                setError("No allocations yet");
                d3.select(svgRef.current).selectAll('*').remove();
                chartInitializedRef.current = false;
                return;
            }

            // Set up dimensions
            const width = dimensions.width || 800;
            const height = dimensions.height || 512;
            const margin = { top: 50, right: 100, bottom: 30, left: 30 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            // Prepare data for the Sankey diagram
            const nodeData: { name: string; color?: string }[] = [
                { name: 'Total Zakat', color: '#94A3B8' }
            ];

            // Add category nodes
            allocatedCategories.forEach(category => {
                nodeData.push({
                    name: category.name,
                    color: category.color
                });
            });

            // Add unallocated if needed
            if (remaining > 0.01) {
                nodeData.push({
                    name: 'Unallocated',
                    color: '#F1F5F9'
                });
            }

            // Create links from total to each category
            const linkData: { source: number; target: number; value: number }[] = [];

            allocatedCategories.forEach((category, index) => {
                linkData.push({
                    source: 0,
                    target: index + 1,
                    value: allocations[category.id].amount
                });
            });

            // Add unallocated link if needed
            if (remaining > 0.01) {
                linkData.push({
                    source: 0,
                    target: nodeData.length - 1,
                    value: remaining
                });
            }

            // Create the Sankey generator
            const sankeyGenerator = sankey<any, any>()
                .nodeWidth(20)
                .nodePadding(15)
                .extent([[margin.left, margin.top], [innerWidth, innerHeight]]);

            // Generate the Sankey layout
            const { nodes, links } = sankeyGenerator({
                nodes: nodeData.map((d, i) => ({ ...d, id: i })),
                links: linkData
            });

            // Clear previous chart
            d3.select(svgRef.current).selectAll('*').remove();

            // Create the SVG elements
            const svg = d3.select(svgRef.current)
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', `translate(0, ${margin.top})`);

            // Create a group for the Sankey diagram
            const g = svg.attr('class', 'sankey-container');

            // Create the links
            g.append('g')
                .attr('class', 'links-group')
                .selectAll('path')
                .data(links)
                .join('path')
                .attr('class', 'sankey-link')
                .attr('d', sankeyLinkHorizontal())
                .attr('stroke', d => {
                    const sourceNode = d.source as SankeyNodeExtended;
                    return sourceNode.color || '#94A3B8';
                })
                .attr('stroke-width', d => Math.max(1, d.width || 1))
                .attr('stroke-opacity', 0.3)
                .attr('fill', 'none')
                .style('mix-blend-mode', 'multiply')
                .style('opacity', 1)
                .on('mouseover', function (event, d: any) {
                    // Highlight this link
                    d3.select(this)
                        .attr('stroke-opacity', 0.6)
                        .attr('stroke-width', Math.max(2, (d.width || 1) + 2));

                    // Show tooltip
                    if (tooltipRef.current) {
                        const sourceNode = d.source as SankeyNodeExtended;
                        const targetNode = d.target as SankeyNodeExtended;
                        const value = d.value;
                        const percentage = (value / totalZakat) * 100;

                        tooltipRef.current.innerHTML = `
                            <div class="font-medium">${sourceNode.name} → ${targetNode.name}</div>
                            <div>${formatCurrency(value, currency)}</div>
                            <div>${percentage.toFixed(1)}% of total</div>
                        `;
                        tooltipRef.current.style.display = 'block';
                        positionTooltip(event, tooltipRef.current);
                    }
                })
                .on('mousemove', function (event) {
                    // Update tooltip position
                    if (tooltipRef.current && tooltipRef.current.style.display === 'block') {
                        positionTooltip(event, tooltipRef.current);
                    }
                })
                .on('mouseout', function () {
                    // Reset link style
                    d3.select(this)
                        .attr('stroke-opacity', 0.3)
                        .attr('stroke-width', d => Math.max(1, (d as any).width || 1));

                    // Hide tooltip
                    if (tooltipRef.current) {
                        tooltipRef.current.style.display = 'none';
                    }
                });

            // Create the nodes
            const nodeGroup = g.append('g')
                .attr('class', 'nodes-group')
                .selectAll('g')
                .data(nodes)
                .join('g')
                .attr('class', 'sankey-node')
                .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

            // Add node rectangles
            nodeGroup.append('rect')
                .attr('height', d => Math.max(1, (d.y1 || 0) - (d.y0 || 0)))
                .attr('width', d => d.x1 - d.x0)
                .attr('fill', d => (d as SankeyNodeExtended).color || '#94A3B8')
                .attr('opacity', 0.8)
                .attr('rx', 2)
                .attr('ry', 2)
                .on('mouseover', function (event, d: any) {
                    // Highlight this node
                    d3.select(this).attr('opacity', 1);

                    // Show tooltip
                    if (tooltipRef.current) {
                        const node = d as SankeyNodeExtended;
                        const value = node.value || 0;
                        const percentage = (value / totalZakat) * 100;

                        tooltipRef.current.innerHTML = `
                            <div class="font-medium">${node.name}</div>
                            <div>${formatCurrency(value, currency)}</div>
                            <div>${percentage.toFixed(1)}% of total</div>
                        `;
                        tooltipRef.current.style.display = 'block';
                        positionTooltip(event, tooltipRef.current);
                    }
                })
                .on('mousemove', function (event) {
                    // Update tooltip position
                    if (tooltipRef.current && tooltipRef.current.style.display === 'block') {
                        positionTooltip(event, tooltipRef.current);
                    }
                })
                .on('mouseout', function () {
                    // Reset node style
                    d3.select(this).attr('opacity', 0.8);

                    // Hide tooltip
                    if (tooltipRef.current) {
                        tooltipRef.current.style.display = 'none';
                    }
                });

            // Add node labels
            nodeGroup.append('text')
                .attr('x', d => (d.x0 || 0) < width / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
                .attr('y', d => ((d.y1 || 0) + (d.y0 || 0)) / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', d => (d.x0 || 0) < width / 2 ? 'start' : 'end')
                .attr('font-size', '12px')
                .attr('fill', '#64748B')
                .text(d => (d as SankeyNodeExtended).name);

            // Add value labels
            nodeGroup.append('text')
                .attr('x', d => (d.x0 || 0) < width / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
                .attr('y', d => ((d.y1 || 0) + (d.y0 || 0)) / 2 + 16)
                .attr('dy', '0.35em')
                .attr('text-anchor', d => (d.x0 || 0) < width / 2 ? 'start' : 'end')
                .attr('font-size', '10px')
                .attr('fill', '#94A3B8')
                .text(d => {
                    const value = d.value || 0;
                    const percentage = (value / totalZakat) * 100;
                    return `${formatCurrency(value, currency)} (${percentage.toFixed(1)}%)`;
                });

            chartInitializedRef.current = true;
        } catch (err) {
            console.error('Error creating Sankey diagram:', err);
            setError('Error creating visualization');
        }
    }, [allocations, dimensions, totalZakat, allocatedCategories, currency, positionTooltip]);

    return (
        <div className="relative" ref={containerRef} style={{ height: '512px' }}>
            {error ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <p className="text-gray-500 mb-2">{error}</p>
                    <p className="text-sm text-gray-400">
                        {error === "No Zakat due calculated yet"
                            ? "Complete your Zakat calculation first"
                            : "Allocate your Zakat to recipient categories to see the distribution"}
                    </p>
                </div>
            ) : (
                <>
                    <svg ref={svgRef} className="w-full h-full"></svg>
                    <div
                        ref={tooltipRef}
                        className="absolute bg-white p-2 border border-gray-100 shadow-sm rounded-md text-xs hidden"
                        style={{ display: 'none', pointerEvents: 'none', zIndex: 100 }}
                    ></div>
                </>
            )}
        </div>
    );
}
*/ 