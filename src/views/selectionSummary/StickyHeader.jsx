import React, { useEffect, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import * as d3 from 'd3';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

function StickyHeader({
  featureData,
  rectWidth,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  height,
  plotSize,
  viewMode,
  handleViewChange,
  ...props
}) {
  // Sort features alphabetically to match FeatureHeatmap
  const sortedFeatures = featureData?.feat_imp
    ? [...featureData.feat_imp].sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  return (
    <div style={{
      height: height,
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      left: 0,
      top: 0,
      zIndex: 1000,
      background: '#1a1a1a', // Dark background to match theme
    }}>
      {/* Empty space to align with scatter plot */}
      <div style={{
        height: plotSize + 25,
        display: 'flex',
        alignItems: 'center',
        padding: '5px'
      }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton
            value="embedding"
            style={{
              backgroundColor: viewMode === 'embedding' ? '#4a4a4a' : '#2a2a2a',
              color: '#ffffff',
              border: '1px solid #333333',
            }}
          >
            Emb.</ToggleButton>
          <ToggleButton
            value="spatial"
            style={{
              backgroundColor: viewMode === 'spatial' ? '#4a4a4a' : '#2a2a2a',
              color: '#ffffff',
              border: '1px solid #333333',
            }}
          >
            Img.
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {/* Feature labels section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {sortedFeatures.map(([feature], i) => {
          const rowHeight = (height - plotSize - 30) / sortedFeatures.length;
          return (
            <div
              key={i}
              style={{
                width: rectWidth,
                cursor: 'pointer',
                transformOrigin: 'left bottom',
                position: 'absolute',
                left: 0,
                top: i * rowHeight,
                whiteSpace: 'nowrap',
                color: sortBy === feature ? '#ffd700' : '#ffffff',
                fontSize: '0.7rem',
                paddingLeft: '4px',
                height: rowHeight,
                display: 'flex',
                alignItems: 'center'
              }}
              onClick={() => {
                if (sortBy === feature) {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(feature);
                  setSortDirection('desc');
                }
              }}
            >
              {feature.slice(0, 10) + '.'}
              {sortBy === feature && (
                <span style={{ marginLeft: '2px' }}>
                  {sortDirection === 'asc' ? '←' : '→'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StickyHeader;