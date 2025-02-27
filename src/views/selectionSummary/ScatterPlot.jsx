import React, { useRef, useEffect, useState, useMemo } from 'react';
import useStore from "../../store";
import * as d3 from 'd3';
import { IconButton } from '@mui/material';
import { CameraswitchOutlined } from '@mui/icons-material';

function ScatterPlot({ data, width = 60, height = 60, ranges, backgroundData, title, selectionIds }) {
  const svgRef = useRef();
  const setHoverSelection = useStore((state) => state.setHoverSelection);
  const viewMode = useStore((state) => state.viewMode);
  const setViewMode = useStore((state) => state.setViewMode);

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!data || !ranges) return;

    // Clear previous plot
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(ranges[0])
      .range([0, plotWidth]);

    const yScale = d3.scaleLinear()
      .domain(ranges[1])
      .range([0, plotHeight]);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#000000')
      .on('mouseenter', () => {
        setHoverSelection(selectionIds);
        setIsHovered(true);
      })
      .on('mouseleave', () => {
        setHoverSelection(null);
        setIsHovered(false);
      });

    // Add plot group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add background points first
    if (backgroundData) {
      g.selectAll('.background-circle')
        .data(backgroundData)
        .enter()
        .append('circle')
        .attr('class', 'background-circle')
        .attr('cx', d => xScale(d[0]))
        .attr('cy', d => yScale(d[1]))
        .attr('r', 0.5)
        .attr('fill', 'rgba(255, 255, 255, 1)');
    }

    // Add selection points on top
    g.selectAll('.selection-circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'selection-circle')
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => yScale(d[1]))
      .attr('r', 1.0)
      .attr('fill', 'rgba(54, 162, 235, 1)');

  }, [data, width, height, ranges, backgroundData, title]);

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
      {isHovered && (
        <IconButton
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            padding: '4px',
            width: '30px',
            height: '30px',
          }}
          onClick={() => setViewMode(viewMode === 'embedding' ? 'spatial' : 'embedding')}
        >
          <CameraswitchOutlined style={{ fontSize: '20px', color: 'white' }} />
        </IconButton>
      )}
    </div>
  );
}

export default ScatterPlot;