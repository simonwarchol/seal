import React, { useRef, useEffect, useState, useMemo } from 'react';

import * as d3 from 'd3';
function ScatterPlot({ data, width = 60, height = 60, ranges, backgroundData, title }) {
    const svgRef = useRef();  
  
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
        .range([ 0,plotHeight,]);
  
      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .style('background-color', '#000000');
  
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
  
    return <svg ref={svgRef} style={{ display: 'block' }} />;
  }
  export default ScatterPlot;