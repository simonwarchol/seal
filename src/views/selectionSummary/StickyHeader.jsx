import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { ToggleButton, ToggleButtonGroup, Box, Typography, IconButton } from '@mui/material';
import useStore from '../../store';
import DensityPlotIcon from "../../public/DensityPlot.svg";
import LolipopPlotIcon from "../../public/LolipopPlot.svg";
import DensityPlotIconWide from "../../public/DensityPlotWide.svg";
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
  selections = [],
  setCompareSelections,
  sortedSelections = [],
  setIsCompareModeActive,
  ...props
}) {
  const hiddenFeatures = useStore((state) => state.hiddenFeatures);
  const setHiddenFeatures = useStore((state) => state.setHiddenFeatures);
  const settingsPanelOpen = useStore((state) => state.settingsPanelOpen);
  const setSettingsPanelOpen = useStore((state) => state.setSettingsPanelOpen);
  const compareMode = useStore((state) => state.compareMode);
  const setCompareMode = useStore((state) => state.setCompareMode);
  const showLolipops = useStore((state) => state.showLolipops);
  const setShowLolipops = useStore((state) => state.setShowLolipops);
  // Sort features alphabetically and filter out hidden features
  const sortedFeatures = featureData?.feat_imp
    ? [...featureData.feat_imp]
      .filter(([feature]) => !hiddenFeatures.includes(feature))
      .sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  // Create importance steps for the gradient
  const importanceSteps = useMemo(() => {
    if (!importanceColorScale?.domain) return Array(10).fill(0);
    const domain = importanceColorScale.domain();
    return d3.range(domain[0], domain[1], (domain[1] - domain[0]) / 10);
  }, [importanceColorScale]);

  const [hoveredLegend, setHoveredLegend] = React.useState(null);
  const [hoveredLolipop, setHoveredLolipop] = React.useState(false);
  const [hoveredDensity, setHoveredDensity] = React.useState(false);
  const channelSelection = useStore((state) => state.channelSelection);


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


        {/* Legend */}
        <Box
          p={0}
          m={0}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            position: 'relative',
          }}
          onMouseEnter={() => setHoveredLegend('legend')}
          onMouseLeave={() => setHoveredLegend(null)}
        >
          {/* Color Legend (Always on top) */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            m: 0,
            p: 0,
          }}>
            <Typography variant="caption" sx={{ color: '#ffffff', m: 0, p: 0 }}>
              {importanceInColor ? 'Importance' : 'Occurrence'}
            </Typography>
            <svg width="60" height="10">
              {importanceInColor ? (
                // Importance color gradient
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
                // Occurrence color gradient
                <>
                  <defs>
                    <linearGradient id="occurrenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={occuranceColorScale(-1)} />
                      <stop offset="50%" stopColor={occuranceColorScale(0)} />
                      <stop offset="100%" stopColor={occuranceColorScale(1)} />
                    </linearGradient>
                  </defs>
                  <rect width="60" height="10" fill="url(#occurrenceGradient)" />
                </>
              )}
            </svg>
          </Box>

          {/* Visualization Type Legend (Always bottom) */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            m: 0,
            p: 0,
          }}>
            <Typography variant="caption" sx={{ color: '#ffffff', m: 0, p: 0 }}>
              {importanceInColor ? 'Occurrence' : 'Importance'}
            </Typography>
            {showLolipops ? (
              // Lollipop visualization
              <svg width="60" height="10">
                <line
                  x1="15"
                  y1="5"
                  x2="55"
                  y2="5"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="15"
                  y1="5"
                  x2="55"
                  y2="5"
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <circle
                  cx="55"
                  cy="5"
                  r="2"
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="1"
                />
              </svg>
            ) : (
              // Distribution visualization
              <img 
                src={DensityPlotIconWide}
                alt="Distribution"
                style={{
                  width: '60px',
                  height: '15px',
                  filter: 'brightness(0) invert(1)', // Make it white
                  objectFit: 'none',
                  transform: 'scale(1, 1)',
                  transformOrigin: 'center',
                  marginTop: '-2px'
                }}
              />
            )}
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
                pointerEvents: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  style={{ 
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                  onClick={() => setImportanceInColor(!importanceInColor)}
                  onMouseEnter={(e) => e.currentTarget.querySelector('svg').style.fill = '#ffa500'}
                  onMouseLeave={(e) => e.currentTarget.querySelector('svg').style.fill = '#ffffff'}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#ffffff">
                    <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" />
                  </svg>
                </div>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  pointerEvents: 'auto',
                  gap: '0px'
                }}>
                  <IconButton
                    onClick={() => setShowLolipops(true)}
                    sx={{
                      padding: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                      '& img': {
                        width: '32px',
                        height: '32px',
                        filter: showLolipops 
                          ? 'brightness(0) invert(1)' // white when true
                          : 'brightness(0) saturate(0) invert(0.2)', // dark gray when false
                        transition: 'filter 0.2s ease-in-out'
                      },
                      '&:hover img': {
                        filter: !showLolipops 
                          ? 'brightness(0) saturate(100%) invert(71%) sepia(81%) saturate(4160%) hue-rotate(360deg) brightness(103%) contrast(105%)' // orange #ffa500
                          : 'brightness(0) invert(1)' // keep white if active
                      }
                    }}
                  >
                    <img 
                      src={LolipopPlotIcon} 
                      alt="Lolipop Plot"
                    />
                  </IconButton>
                  <IconButton
                    onClick={() => setShowLolipops(false)}
                    sx={{
                      padding: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                      '& img': {
                        width: '32px',
                        height: '32px',
                        filter: !showLolipops 
                          ? 'brightness(0) invert(1)' // white when true
                          : 'brightness(0) saturate(0) invert(0.2)', // dark gray when false
                        transition: 'filter 0.2s ease-in-out'
                      },
                      '&:hover img': {
                        filter: showLolipops 
                          ? 'brightness(0) saturate(100%) invert(71%) sepia(81%) saturate(4160%) hue-rotate(360deg) brightness(103%) contrast(105%)' // orange #ffa500
                          : 'brightness(0) invert(1)' // keep white if active
                      }
                    }}
                  >
                    <img 
                      src={DensityPlotIcon} 
                      alt="Density Plot"
                    />
                  </IconButton>
                </Box>
              </div>
            </div>
          )}
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          size="small"
          m={0}
          p={0}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ToggleButton
            value="channels"
            m={0}
            onClick={() => {
              const newCompareMode = !compareMode;
              setCompareMode(newCompareMode);
              
              // If enabling compare mode and exactly 2 selections are visible, auto-select them
              if (newCompareMode && selections && selections.length === 2) {
                // Convert selections to the format expected by setCompareSelections
                const selectionObjects = selections.map(selectionPath => {
                  // Find the corresponding selection object from sortedSelections
                  const matchingSelection = sortedSelections.find(s => 
                    s.path[0] === selectionPath[0] && s.path[1] === selectionPath[1]
                  );
                  return matchingSelection || { path: selectionPath };
                });
                
                setCompareSelections(selectionObjects);
                setIsCompareModeActive(true); // Set to true since we have exactly 2 selections
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#ffffff',
              border: 'none',
              padding: '0 0 0 0'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#ffffff',
                margin: '4px 0'
              }}
              style={{
                cursor: 'pointer',
                color: compareMode ? '#ffd700' : '#ffffff'
              }}
            >
              Compare ⇆
            </Typography>
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
          // if channelSelection.channelNames includes feature, then color is channelSelection.channelColors[feature]
          // check index of feature in channelSelection.channelNames
          const index = channelSelection.channelNames.indexOf(feature);
          const color = index !== -1 ? channelSelection.channelColors[index] : [255, 255, 255];
          const colorString = `rgb(${color[0]},${color[1]},${color[2]})`;

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
                color: sortBy === feature ? '#ffd700' : colorString,
                fontSize: '0.7rem',
                paddingLeft: '4px',
                height: rowHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div
                onClick={() => {
                  if (sortBy === feature) {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(feature);
                    setSortDirection('desc');
                  }
                }}
                style={{ flex: 1 }}
              >
                {feature.slice(0, 10) + '.'}
                {sortBy === feature && (
                  <span style={{ marginLeft: '2px' }}>
                    {sortDirection === 'asc' ? '←' : '→'}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("feature", feature);
                  setHiddenFeatures(
                    hiddenFeatures.includes(feature)
                      ? hiddenFeatures.filter(f => f !== feature)
                      : [...hiddenFeatures, feature]
                  );
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: hiddenFeatures.includes(feature) ? '#666' : '#fff',
                  cursor: 'pointer',
                  padding: '2px',
                  fontSize: '0.7rem',
                  marginRight: '4px',
                  opacity: hiddenFeatures.includes(feature) ? 0.5 : 1
                }}
              >
                {hiddenFeatures.includes(feature) ? '⊕' : '⊖'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StickyHeader;