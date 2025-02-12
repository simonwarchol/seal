import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

function FeatureHeatmap({ featureData, height, width }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!featureData?.feat_imp || !width || !height) return;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Sort features alphabetically
    const sortedFeatures = [...featureData.feat_imp].sort((a, b) => a[0].localeCompare(b[0]));

    const rectWidth = width / sortedFeatures.length;
    const halfHeight = height / 2;

    // Calculate normalized differences
    const getNormalizedDiff = (featureName) => {
      const summary = featureData.selection_mean_features[featureName];
      const global = featureData.summary.global_mean_features[featureName];
      return (summary - global) / global;
    };

    // Create color scale for importance
    const importanceColorScale = d3.scaleSequential()
      .domain([0, d3.max(sortedFeatures, d => d[1])])
      .interpolator(d3.interpolateViridis);

    // Create a group for the rectangles
    const g = svg.append("g");

    // Add feature importance rectangles (full height)
    g.selectAll(".importance-rect")
      .data(sortedFeatures)
      .join("rect")
      .attr("x", (d, i) => i * rectWidth)
      .attr("y", 0)
      .attr("width", rectWidth)
      .attr("height", height)
      .attr("fill", d => importanceColorScale(d[1]));

    // Add difference lines - white with black stroke
    g.selectAll(".diff-line")
      .data(sortedFeatures)
      .join("line")
      .attr("x1", (d, i) => i * rectWidth + rectWidth / 2)
      .attr("y1", height / 2)
      .attr("x2", (d, i) => i * rectWidth + rectWidth / 2)
      .attr("y2", (d) => {
        const diff = getNormalizedDiff(d[0]);
        return height / 2 - (diff * height / 3);
      })
      .attr("stroke", "#000000")
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .clone(true)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1);

    // Add circles to create lollipop effect
    g.selectAll(".diff-circle")
      .data(sortedFeatures)
      .join("circle")
      .attr("cx", (d, i) => i * rectWidth + rectWidth / 2)
      .attr("cy", (d) => {
        const diff = getNormalizedDiff(d[0]);
        return height / 2 - (diff * height / 3);
      })
      .attr("r", rectWidth / 6)
      .attr("fill", "#ffffff")
      .attr("stroke", "#000000")
      .attr("stroke-width", 1);

  }, [featureData, height, width]);

  // Set initial dimensions
  return <svg ref={svgRef} width={width} height={height} />;
}

export default FeatureHeatmap;