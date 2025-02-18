import React, { useEffect, useRef, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import * as d3 from 'd3';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Box, Typography } from '@mui/material';

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
  importanceColorScale,
  occuranceColorScale,
  ...props
}) {
  // Sort features alphabetically to match FeatureHeatmap
  const sortedFeatures = featureData?.feat_imp
    ? [...featureData.feat_imp].sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  // Create importance steps for the gradient
  const importanceSteps = useMemo(() => {
    if (!importanceColorScale?.domain) return Array(10).fill(0);
    const domain = importanceColorScale.domain();
    return d3.range(domain[0], domain[1], (domain[1] - domain[0]) / 10);
  }, [importanceColorScale]);

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
        flexDirection: 'column',
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

        {/* Legend */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 1, 
          mt: 1,
          alignItems: 'flex-start',
          paddingLeft: 2
        }}>
          {/* Importance Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#ffffff', width: '70px' }}>
              Importance
            </Typography>
            <svg width="60" height="10">
              <defs>
                <linearGradient id="importanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <stop
                      key={i}
                      offset={`${i * 10}%`}
                      stopColor={importanceColorScale ? importanceColorScale(importanceSteps[i]) : '#000000'}
                    />
                  ))}
                </linearGradient>
              </defs>
              <rect width="60" height="10" fill="url(#importanceGradient)" />
            </svg>
          </Box>

          {/* Occurrence Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#ffffff', width: '70px' }}>
              Occurrence
            </Typography>
            <svg width="60" height="10">
              <defs>
                <linearGradient id="occuranceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={occuranceColorScale(-1)} />
                  <stop offset="50%" stopColor={occuranceColorScale(0)} />
                  <stop offset="100%" stopColor={occuranceColorScale(1)} />
                </linearGradient>
              </defs>
              <rect width="60" height="10" fill="url(#occuranceGradient)" />
            </svg>
          </Box>
        </Box>
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