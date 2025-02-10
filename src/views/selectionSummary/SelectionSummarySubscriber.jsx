import React, { useRef, useEffect, useState } from 'react';
import { useCoordination, TitleInfo } from '@vitessce/vit-s';
import { COMPONENT_COORDINATION_TYPES, ViewType } from '@vitessce/constants-internal';
import { capitalize } from '@vitessce/utils';
import { Card, CardContent, Typography } from '@material-ui/core';
import useStore from "../../store";
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import * as d3 from 'd3';

function ScatterPlot({ data, width = 80, height = 80, ranges, backgroundData, title }) {
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
      .range([plotHeight, 0]);

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

function SelectionsDisplay({ selections }) {
  const setFeatures = useStore((state) => state.setFeatures);
  const [viewMode, setViewMode] = useState('embedding');

  const handleViewChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        width: '80px',
        zIndex: 1000,
        marginBottom: '2px'
      }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          size="small"
          style={{
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            border: '1px solid #333333',
            borderRadius: '4px',
            width: '100%'
          }}
        >
          <ToggleButton
            value="embedding"
            style={{
              color: viewMode === 'embedding' ? '#ffffff' : '#888888',
              textTransform: 'none',
              padding: '2px 8px',
              fontSize: '0.75rem',
              flex: 1
            }}
          >
            {viewMode === 'embedding' ? 'Emb.' : 'E'}
          </ToggleButton>
          <ToggleButton
            value="spatial"
            style={{
              color: viewMode === 'spatial' ? '#ffffff' : '#888888',
              textTransform: 'none',
              padding: '2px 8px',
              fontSize: '0.75rem',
              flex: 1
            }}
          >
            {viewMode === 'spatial' ? 'Spatial' : 'S'}
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      {selections?.map((selection, i) => {
        const featureData = setFeatures[selection[0]]?.[selection[1]];

        return (
          <Card key={i} variant="outlined" style={{ backgroundColor: '#1E1E1E', borderColor: '#333333', padding: 1 }}>
            <CardContent style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '5px' }}>
                <Typography variant="subtitle2" style={{ color: '#ffffff', fontSize: '0.7rem' }}>
                  {selection.join(' > ')}
                </Typography>
                {featureData?.feat_imp && (
                  <div style={{ width: '100%', height: '100%', padding: 0, margin: 0, lineHeight: 0 }}>
                    {viewMode === 'embedding' ? (
                      <ScatterPlot
                        data={featureData.embedding_coordinates}
                        backgroundData={featureData.summary.embedding_subsample}
                        ranges={[
                          [featureData.summary.embedding_ranges[0][0], featureData.summary.embedding_ranges[0][1]],
                          [featureData.summary.embedding_ranges[1][0], featureData.summary.embedding_ranges[1][1]]
                        ]}
                        title="Embedding"
                      />
                    ) : (
                      <ScatterPlot
                        data={featureData.spatial_coordinates}
                        backgroundData={featureData.summary.spatial_subsample}
                        ranges={[
                          [featureData.summary.spatial_ranges[0][0], featureData.summary.spatial_ranges[0][1]],
                          [featureData.summary.spatial_ranges[1][0], featureData.summary.spatial_ranges[1][1]]
                        ]}
                        title="Spatial"
                      />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function SelectionsSummarySubscriber(props) {
  const { coordinationScopes, title: titleOverride, theme } = props;

  const [{ obsType, obsSetSelection }] = useCoordination(
    COMPONENT_COORDINATION_TYPES[ViewType.OBS_SETS],
    coordinationScopes
  );

  const title = titleOverride || `${capitalize(obsType)} Selections`;

  return (
    <TitleInfo
      title={title}
      isScroll
      closeButtonVisible={false}
      downloadButtonVisible={false}
      removeGridComponent={false}
      urls={[]}
      theme={theme}
      isReady={true}
      helpText={''}
      style={{ backgroundColor: '#121212', color: '#ffffff' }}
    >
      <SelectionsDisplay selections={obsSetSelection} />
    </TitleInfo>
  );
}
