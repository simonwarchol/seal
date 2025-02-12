import React, { useEffect } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import * as d3 from 'd3';

function StickyHeader({ viewMode, handleViewChange, headerRef,
  sortBy, setSortBy, sortDirection, setSortDirection, featureData,
  rectWidth, displayedChannels, channelNames }) {
  console.log('todo displayedChannels', displayedChannels, channelNames);
  useEffect(() => {
    if (!headerRef.current || !featureData?.feat_imp) return;

    // Sort features alphabetically
    const sortedFeatures = [...featureData.feat_imp].sort((a, b) => a[0].localeCompare(b[0]));

    // Create SVG container if it doesn't exist
    let svg = d3.select(headerRef.current).select('svg');
    if (svg.empty()) {
      svg = d3.select(headerRef.current)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '60px');
    }

    // Update or create labels
    const labels = svg.selectAll('text')
      .data(sortedFeatures);

    // Remove extra labels
    labels.exit().remove();

    // Add new labels with click handlers
    labels.enter()
      .append('text')
      .merge(labels)
      .attr('x', 0)
      .attr('y', 0)
      .attr('transform', (d, i) => `translate(${i * rectWidth + rectWidth / 2 + 1}, 60) rotate(-90)`)
      .attr('text-anchor', 'start')
      .attr('fill', d => {
        const channelIndex = channelNames.findIndex(name => name === d[0]);
        // check if a channel in displayed channel has selection.c === channelIndex
        const channel = displayedChannels.find(c => c.selection.c === channelIndex);
        console.log('todo, channel', channel);
        const channelColor = channel?.color;
        // This is [r, g, b in 255 range]
        const color = channelColor ? `rgb(${channelColor[0]}, ${channelColor[1]}, ${channelColor[2]})` : '#ffffff';
        return color;
      })
      .style('font-size', '0.6rem')
      .style('cursor', 'pointer')
      .each(function (d) {
        const text = d3.select(this);
        if (d[0] === sortBy) {
          const arrow = sortDirection === 'desc' ? '◄' : '► ';
          text.text(arrow + ' ' + d[0]);
        } else {
          text.text(d[0]);
        }
      })
      .on('click', (event, d) => {
        if (sortBy === d[0]) {
          setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
          setSortBy(d[0]);
          setSortDirection('desc');
        }
      });

  }, [headerRef, featureData, rectWidth, sortBy, sortDirection, displayedChannels, channelNames]);

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      width: '100%',
      zIndex: 1000,
      marginBottom: '2px',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'rgba(30, 30, 30, 0.8)',
      margin: '5px'
    }}>
      <div style={{ width: '80px' }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          size="small"
          style={{
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            border: '1px solid #333333',
            borderRadius: '4px',
            width: '80px'
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
      <div ref={headerRef} style={{ flex: 1, height: '60px', marginLeft: '5px' }} />
    </div>
  );
}

export default StickyHeader;