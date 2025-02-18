import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

function FeatureHeatmap({ 
  featureData, 
  width,
  importanceColorScale,
  occuranceColorScale 
}) {
  const svgRef = useRef();

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

    // Calculate normalized differences
    const getNormalizedDiff = (featureName) => {
      const summary = featureData.selection_mean_features[featureName];
      const global = featureData.summary.global_mean_features[featureName];
      return (summary - global) / global;
    };

    // Create a group for the rectangles
    const g = svg.append("g");

    // Add feature importance rectangles (full width)
    g.selectAll(".importance-rect")
      .data(sortedFeatures)
      .join("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * rectHeight)
      .attr("width", width)
      .attr("height", rectHeight)
      .attr("fill", d => importanceColorScale(d[1]));

    // Add difference lines - white with black stroke
    g.selectAll(".diff-line")
      .data(sortedFeatures)
      .join("line")
      .attr("x1", width / 2)
      .attr("y1", (d, i) => i * rectHeight + rectHeight / 2)
      .attr("x2", (d) => {
        const diff = getNormalizedDiff(d[0]);
        return width / 2 + (diff * width / 3);
      })
      .attr("y2", (d, i) => i * rectHeight + rectHeight / 2)
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
      .attr("cx", (d) => {
        const diff = getNormalizedDiff(d[0]);
        return width / 2 + (diff * width / 3);
      })
      .attr("cy", (d, i) => i * rectHeight + rectHeight / 2)
      .attr("r", rectHeight / 6)
      .attr("fill", "#ffffff")
      .attr("stroke", "#000000")
      .attr("stroke-width", 1);

  }, [featureData, width, importanceColorScale, occuranceColorScale]);

  // Set initial dimensions
  return <svg ref={svgRef} width={width} height={'100%'} />;
}

export default FeatureHeatmap;