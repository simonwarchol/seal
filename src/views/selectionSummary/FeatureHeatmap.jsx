import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import StickyHeader from './StickyHeader';

function FeatureHeatmap({
  featureData,
  width,
  importanceColorScale,
  occuranceColorScale,
  importanceInColor,
  setImportanceInColor
}) {
  const svgRef = useRef();
  console.log('fd', featureData,featureData.normalized_occurrence);

  useEffect(() => {
    if (!featureData?.feat_imp || !width || !importanceColorScale || !occuranceColorScale) return;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    const height = svg.node().getBoundingClientRect().height;

    if (!height) return;

    svg.selectAll("*").remove();

    // Sort features alphabetically
    const sortedFeatures = [...featureData.feat_imp].sort((a, b) => a[0].localeCompare(b[0]));

    const rectHeight = height / sortedFeatures.length;
    const halfWidth = width / 2;

    // Create a group for the rectangles

    // Create a group for the rectangles
    const g = svg.append("g");

    // Add background rectangles with colors
    g.selectAll(".background-rect")
      .data(sortedFeatures)
      .join("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * rectHeight)
      .attr("width", width)
      .attr("height", rectHeight)
      .attr("fill", d => importanceInColor ?
        importanceColorScale(d[1]) :
        occuranceColorScale(featureData.normalized_occurrence[d[0]])
      );

    if (importanceInColor) {
      // Add diverging lollipops for occurrence differences
      g.selectAll(".occurrence-line")
        .data(sortedFeatures)
        .join("line")
        .attr("x1", halfWidth)
        .attr("x2", d => {
          const diff = featureData.normalized_occurrence[d[0]];
          return halfWidth + (diff * halfWidth * 0.4); // Use 40% of half width
        })
        .attr("y1", (d, i) => i * rectHeight + rectHeight / 2)
        .attr("y2", (d, i) => i * rectHeight + rectHeight / 2)
        .attr("stroke", "#000000")
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .clone(true)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1);

      // Add circles at the end of occurrence lollipops
      g.selectAll(".occurrence-circle")
        .data(sortedFeatures)
        .join("circle")
        .attr("cx", d => {
          const diff = featureData.normalized_occurrence[d[0]];
          return halfWidth + (diff * halfWidth * 0.4);
        })
        .attr("cy", (d, i) => i * rectHeight + rectHeight / 2)
        .attr("r", rectHeight / 6)
        .attr("fill", "#ffffff")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1);

      // Add center line
      g.append("line")
        .attr("x1", halfWidth)
        .attr("x2", halfWidth)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#666")
        .attr("stroke-width", 1);
    } else {
      // Show importance lollipops
      const maxImportance = d3.max(sortedFeatures, d => d[1]);

      const importanceScale = d3.scaleLinear()
        .domain([0, maxImportance])
        .range([0, width / 3]);

      g.selectAll(".importance-line")
        .data(sortedFeatures)
        .join("line")
        .attr("x1", width * 0.1)
        .attr("x2", d => width * 0.1 + importanceScale(d[1]))
        .attr("y1", (d, i) => i * rectHeight + rectHeight / 2)
        .attr("y2", (d, i) => i * rectHeight + rectHeight / 2)
        .attr("stroke", "#000000")
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .clone(true)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1);

      g.selectAll(".importance-circle")
        .data(sortedFeatures)
        .join("circle")
        .attr("cx", d => width * 0.1 + importanceScale(d[1]))
        .attr("cy", (d, i) => i * rectHeight + rectHeight / 2)
        .attr("r", rectHeight / 6)
        .attr("fill", "#ffffff")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1);
    }

  }, [featureData, width, importanceColorScale, occuranceColorScale, importanceInColor]);

  // Set initial dimensions
  return (
    <>
      <svg ref={svgRef} width={width} height={'100%'} />

    </>
  );
}

export default FeatureHeatmap;