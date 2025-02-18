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
  importanceInColor = true,
  setImportanceInColor,
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

  const [hoveredLegend, setHoveredLegend] = React.useState(null);

  // Add this component for the reverse icon
  const ReverseIcon = () => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.7)',
      cursor: 'pointer',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M9 3L5 7l4 4V9c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8V3z"/>
      </svg>
    </div>
  );

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
        <Box 
          p={0} 
          m={0} 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            position: 'relative',
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHoveredLegend('legend')}
          onMouseLeave={() => setHoveredLegend(null)}
          onClick={() => setImportanceInColor(!importanceInColor)}
        >
          {/* Importance Legend (Always on top) */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            m: 0, 
            p: 0,
          }}>
            <Typography variant="caption" sx={{ color: '#ffffff', m: 0, p: 0 }}>
              Importance
            </Typography>
            <svg width="60" height="10">
              {importanceInColor ? (
                // Color gradient when importanceInColor is true
                <>
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
                </>
              ) : (
                // Positive-only lollipop when importanceInColor is false
                <>
                  <line
                    x1="15"
                    y1="5"
                    x2="45"
                    y2="5"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="15"
                    y1="5"
                    x2="45"
                    y2="5"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="45"
                    cy="5"
                    r="2"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="1"
                  />
                </>
              )}
            </svg>
          </Box>

          {/* Occurrence Legend (Always bottom) */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            m: 0, 
            p: 0,
          }}>
            <Typography variant="caption" sx={{ color: '#ffffff', m: 0, p: 0 }}>
              Occurence
            </Typography>
            <svg width="60" height="10">
              {importanceInColor ? (
                // Bidirectional lollipop when importanceInColor is true
                <>
                  <line
                    x1="30"
                    y1="5"
                    x2="45"
                    y2="5"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="30"
                    y1="5"
                    x2="45"
                    y2="5"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="45"
                    cy="5"
                    r="2"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  <text
                    x="50"
                    y="8"
                    fontSize="8"
                    fill="#ffffff"
                  >
                    +
                  </text>
                  <line
                    x1="30"
                    y1="5"
                    x2="15"
                    y2="5"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="30"
                    y1="5"
                    x2="15"
                    y2="5"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="15"
                    cy="5"
                    r="2"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  <text
                    x="5"
                    y="8"
                    fontSize="8"
                    fill="#ffffff"
                  >
                    -
                  </text>
                </>
              ) : (
                // Occurrence color gradient when importanceInColor is false
                <>
                  <defs>
                    <linearGradient id="occurrenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <stop
                          key={i}
                          offset={`${i * 10}%`}
                          stopColor={occuranceColorScale ? occuranceColorScale(-1 + (i * 0.2)) : '#000000'}
                        />
                      ))}
                    </linearGradient>
                  </defs>
                  <rect width="60" height="10" fill="url(#occurrenceGradient)" />
                </>
              )}
            </svg>
          </Box>
          {hoveredLegend === 'legend' && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.7)',
                cursor: 'pointer',
                pointerEvents: 'none', // This ensures mouse events pass through to parent
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M9 3L5 7l4 4V9c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8V3z"/>
              </svg>
            </div>
          )}
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