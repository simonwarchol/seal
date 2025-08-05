import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import StickyHeader from './StickyHeader';
import useStore from '../../store';

function FeatureHeatmap({
  featureData,
  width,
  importanceColorScale,
  occuranceColorScale,
  importanceInColor,
  setImportanceInColor
}) {
  const svgRef = useRef();
  const hiddenFeatures = useStore((state) => state.hiddenFeatures);
  const maxRelativeOccurance = useStore((state) => state.maxRelativeOccurance);
  const maxRelativeFeatureImportance = useStore((state) => state.maxRelativeFeatureImportance);
  const showLolipops = useStore((state) => state.showLolipops);

  useEffect(() => {
    if (!featureData?.feat_imp || !width || !importanceColorScale || !occuranceColorScale) return;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    const height = svg.node().getBoundingClientRect().height;

    if (!height) return;

    svg.selectAll("*").remove();

    // Sort features alphabetically and filter out hidden features
    const sortedFeatures = [...featureData.feat_imp]
      .filter(([feature]) => !hiddenFeatures.includes(feature))
      .sort((a, b) => a[0].localeCompare(b[0]));

    const maxFeatureImportance = Math.max(...sortedFeatures.map(d => d[1]));

    // Adjust height based on visible features
    const rectHeight = height / sortedFeatures.length;
    const halfWidth = width / 2;

    // Create a group for the rectangles
    const g = svg.append("g");

    // Add background rectangles with colors
    g.selectAll(".background-rect")
      .data(sortedFeatures)
      .join("rect")
              .attr("x", 0)
        .attr("y", (d, i) => {
          const y = i * rectHeight;
          return isFinite(y) ? y : 0;
        })
        .attr("width", width)
        .attr("height", rectHeight)
      .attr("fill", d => importanceInColor ?
        importanceColorScale(d[1]) :
        occuranceColorScale(featureData.normalized_occurrence[d[0]])
      )
      .on("mouseover", (event, d) => {
        if (!importanceInColor) {
          const value = featureData.normalized_occurrence[d[0]];
          console.log(`xxx ${d[0]} occurrence: ${value}`);
        }
      });

    if (!showLolipops) {
      // Draw density plots for each feature
      sortedFeatures.forEach((feature, i) => {
        const densityData = importanceInColor ? 
          (featureData.feat_imp_density && featureData.feat_imp_density[feature[0]]) : 
          (featureData.occurrence_density && featureData.occurrence_density[feature[0]]);

        if (!densityData || !densityData.bins || !densityData.counts) return;

        // Create scales for the density plot
        const xScale = d3.scaleLinear()
          .domain([densityData.min, densityData.max])
          .range([0, width]);

        const yScale = d3.scaleLinear()
          .domain([0, Math.max(...densityData.counts)])
          .range([rectHeight, 0]);

        // Create area generator
        const area = d3.area()
          .x((d, i) => xScale((densityData.bins[i] + densityData.bins[i + 1]) / 2))
          .y0(rectHeight)
          .y1(d => yScale(d))
          .curve(d3.curveBasis);

        // Create a group for this feature's density plot
        const featureGroup = g.append("g")
          .attr("transform", `translate(0, ${isFinite(i * rectHeight) ? i * rectHeight : 0})`);

        // Draw the density area
        featureGroup.append("path")
          .datum(densityData.counts)
          .attr("fill", "rgba(255, 255, 255, 0.3)")
          .attr("d", area);

        // Draw the top line of the density plot with a black stroke
        featureGroup.append("path")
          .datum(densityData.counts)
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", 0.5)
          .attr("d", area);
      });
    } else {
      if (importanceInColor) {
        // Add diverging lollipops for occurrence differences
        g.selectAll(".occurrence-line")
          .data(sortedFeatures)
          .join("line")
          .attr("x1", halfWidth)
          .attr("x2", d => {
            const diff = featureData.normalized_occurrence[d[0]];
            // Handle NaN, undefined, or infinite values
            if (diff === undefined || isNaN(diff) || !isFinite(diff)) return halfWidth;
            // Scale by maxRelativeOccurance
            const scaledValue = halfWidth + ((diff / maxRelativeOccurance) * halfWidth * 0.9);
            return isFinite(scaledValue) ? scaledValue : halfWidth;
          })
          .attr("y1", (d, i) => {
            const y = i * rectHeight + rectHeight / 2;
            return isFinite(y) ? y : 0;
          })
          .attr("y2", (d, i) => {
            const y = i * rectHeight + rectHeight / 2;
            return isFinite(y) ? y : 0;
          })
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
            // Handle NaN, undefined, or infinite values
            if (diff === undefined || isNaN(diff) || !isFinite(diff)) return halfWidth;
            // Scale by maxRelativeOccurance
            const scaledValue = halfWidth + ((diff / maxRelativeOccurance) * halfWidth * 0.9);
            return isFinite(scaledValue) ? scaledValue : halfWidth;
          })
          .attr("cy", (d, i) => {
            const y = i * rectHeight + rectHeight / 2;
            return isFinite(y) ? y : 0;
          })
          .attr("r", rectHeight / 4)
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
        const importanceScale = d3.scaleLinear()
          .domain([0, maxFeatureImportance])  // Feature importance values are always positive
          .range([0, width * 0.9]);  // Use 90% of total width for better visibility

        g.selectAll(".importance-line")
          .data(sortedFeatures)
          .join("line")
          .attr("x1", 0)
          .attr("x2", d => {
            const scaledValue = importanceScale(d[1]);
            return isFinite(scaledValue) ? scaledValue : 0;
          })
          .attr("y1", (d, i) => {
            const y = i * rectHeight + rectHeight / 2;
            return isFinite(y) ? y : 0;
          })
          .attr("y2", (d, i) => {
            const y = i * rectHeight + rectHeight / 2;
            return isFinite(y) ? y : 0;
          })
          .attr("stroke", "#000000")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round")
          .clone(true)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1);

        g.selectAll(".importance-circle")
          .data(sortedFeatures)
          .join("circle")
          .attr("cx", d => {
            const scaledValue = importanceScale(d[1]);
            return isFinite(scaledValue) ? scaledValue : 0;
          })
          .attr("cy", (d, i) => {
            const y = i * rectHeight + rectHeight / 2;
            return isFinite(y) ? y : 0;
          })
          .attr("r", rectHeight / 6)
          .attr("fill", "#ffffff")
          .attr("stroke", "#000000")
          .attr("stroke-width", 1);
      }
    }

  }, [featureData, width, importanceColorScale, occuranceColorScale, importanceInColor, hiddenFeatures, maxRelativeOccurance, maxRelativeFeatureImportance, showLolipops]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height="100%"
      style={{ display: 'block' }}
    />
  );
}

export default FeatureHeatmap;