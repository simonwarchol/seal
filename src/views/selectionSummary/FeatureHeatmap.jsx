import React, { useRef, useEffect} from 'react';


import * as d3 from 'd3';
function FeatureHeatmap({ featureData, height, width }) {
  const svgRef = useRef();

  useEffect(() => {
    console.log('fd', width);
    if (!featureData?.feat_imp || !width || !height) return;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rectWidth = width / featureData.feat_imp.length;

    // Create color scale based on feature importance values
    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(featureData.feat_imp, d => d[1])])
      .interpolator(d3.interpolateViridis);

    // Create a group for the rectangles
    const g = svg.append("g");

    // Add heatmap rectangles using data binding pattern
    g.selectAll("rect")
      .data(featureData.feat_imp)
      .join("rect")
      .attr("x", (d, i) => i * rectWidth)
      .attr("y", 0)
      .attr("width", Math.max(1, rectWidth - 1))
      .attr("height", height)
      .attr("fill", d => colorScale(d[1]));

  }, [featureData, height, width]);

  // Set initial dimensions
  return <svg ref={svgRef} width={width} height={height} />;
}
export default FeatureHeatmap;