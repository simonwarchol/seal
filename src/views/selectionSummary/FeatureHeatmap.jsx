import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
function FeatureHeatmap({ featureData, height, width }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!featureData?.feat_imp || !width || !height) return;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rectWidth = width / featureData.feat_imp.length;
    const halfHeight = height / 2;

    // Calculate normalized differences
    const getNormalizedDiff = (featureName) => {
      const summary = featureData.selection_mean_features[featureName];
      const global = featureData.summary.global_mean_features[featureName];
      return (summary - global) / global;
    };

    // Create color scales
    const importanceColorScale = d3.scaleSequential()
      .domain([0, d3.max(featureData.feat_imp, d => d[1])])
      .interpolator(d3.interpolateViridis);

    const diffColorScale = d3.scaleSequential()
      .domain([1, -1])
      .interpolator(d3.interpolateRdBu);

    // Create a group for the rectangles
    const g = svg.append("g");

    // Add feature importance rectangles (top half)
    g.selectAll(".importance-rect")
      .data(featureData.feat_imp)
      .join("rect")
      .attr("x", (d, i) => i * rectWidth)
      .attr("y", 0)
      .attr("width", Math.max(1, rectWidth - 1))
      .attr("height", halfHeight)
      .attr("fill", d => importanceColorScale(d[1]));

    // Add difference rectangles (bottom half)
    g.selectAll(".diff-rect")
      .data(featureData.feat_imp)
      .join("rect")
      .attr("x", (d, i) => i * rectWidth)
      .attr("y", halfHeight)
      .attr("width", Math.max(1, rectWidth - 1))
      .attr("height", halfHeight)
      .attr("fill", d => diffColorScale(getNormalizedDiff(d[0])));

  }, [featureData, height, width]);

  // Set initial dimensions
  return <svg ref={svgRef} width={width} height={height} />;
}
export default FeatureHeatmap;