import React, { useEffect, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import * as d3 from 'd3';

function StickyHeader({ 
  featureData,
  rectWidth,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  height,
  plotSize,
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
    }}>
      {/* Empty space to align with scatter plot */}
      <div style={{ height: plotSize + 25 }} />
      
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
              {feature}
              {sortBy === feature && (
                <span style={{ marginLeft: '2px' }}>
                  {sortDirection === 'asc' ? '↑' : '↓'}
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