import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useCoordination, TitleInfo, useLoaders, useImageData, useObsSetsData } from '@vitessce/vit-s';
import { COMPONENT_COORDINATION_TYPES, ViewType, CoordinationType as ct } from '@vitessce/constants-internal';
import { capitalize } from '@vitessce/utils';
import { treeFindNodeByNamePath, mergeObsSets } from '@vitessce/sets-utils';
import { Card, CardContent, Typography } from '@material-ui/core';
import useStore from "../../store";
import ScatterPlot from './ScatterPlot';
import FeatureHeatmap from './FeatureHeatmap';

import StickyHeader from './StickyHeader';
import * as d3 from 'd3';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import SetOperationIcon from './SetOperationIcon';
import { iconConfigs } from './SetOperationIcon';

const OPERATION_NAMES = {
  'a_minus_intersection': 'Only in first set',
  'b_minus_intersection': 'Only in second set',
  'intersection': 'Intersection',
  'a_plus_b_minus_intersection': 'Symmetric diff.',
  'a_plus_b': 'Union',
  'complement': 'Complement'
};

function SelectionColumn({
  selection,
  setFeatures,
  viewMode,
  PLOT_SIZE,
  heatmapContainerWidth,
  heatmapContainerRef,
  isVisible,
  onVisibilityToggle,
  onClick,
  style,
  colorScheme,
  cellSets,
  compareMode
}) {
  // Add ref and state for column width
  const columnRef = useRef(null);
  const [columnWidth, setColumnWidth] = useState(PLOT_SIZE * 2);

  // Add effect to track column width
  useEffect(() => {
    const updateWidth = () => {
      if (columnRef.current) {
        const width = columnRef.current.getBoundingClientRect().width;
        setColumnWidth(width);
      }
    };

    const resizeObserver = new ResizeObserver(updateWidth);
    if (columnRef.current) {
      resizeObserver.observe(columnRef.current);
    }

    // Initial measurement
    updateWidth();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate the actual width for plots (subtracting padding)
  const plotWidth = columnWidth - 4;

  return (
    <div
      ref={columnRef}
      onClick={onClick}
      style={{
        padding: '2px',
        width: '100%',
        height: '100%',
        cursor: compareMode ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: `${PLOT_SIZE * 2}px`,
        ...style
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '20px' }}>
          <Typography variant="subtitle2" style={{ color: '#ffffff', fontSize: '0.7rem' }}>
            <span style={{ color: colorScheme(cellSets?.tree?.findIndex(child => child.name === selection.path[0]) + 1) }}>
              {selection?.path?.[0]}
            </span>
            {'-'}
            <span>{selection?.path?.[1]}</span>
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onVisibilityToggle();
            }}
            style={{
              padding: 4,
              position: 'relative',
              visibility: compareMode ? 'hidden' : 'visible'
            }}
          >
            {isVisible ? (
              <VisibilityOutlined style={{ fontSize: 16, color: '#ffffff' }} />
            ) : (
              <VisibilityOffOutlined style={{ fontSize: 16, color: '#666666' }} />
            )}
          </IconButton>
        </div>
        {setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.feat_imp && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ height: `${PLOT_SIZE}px`, padding: 0, margin: 0, lineHeight: 0 }}>
              {viewMode === 'embedding' ? (
                <ScatterPlot
                  data={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.embedding_coordinates}
                  backgroundData={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_subsample}
                  ranges={[
                    [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[0][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[0][1]],
                    [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[1][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[1][1]]
                  ]}
                  height={PLOT_SIZE}
                  width={plotWidth}
                  title="Embedding"
                />
              ) : (
                <ScatterPlot
                  data={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.spatial_coordinates}
                  backgroundData={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.spatial_subsample}
                  ranges={[
                    [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.spatial_ranges[0][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.spatial_ranges[0][1]],
                    [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.spatial_ranges[1][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.spatial_ranges[1][1]]
                  ]}
                  height={PLOT_SIZE}
                  width={plotWidth}
                  title="Spatial"
                />
              )}
            </div>
            <div
              ref={heatmapContainerRef}
              style={{
                flex: 1,
                marginTop: '2px',
                width: '100%'
              }}
            >
              <FeatureHeatmap
                featureData={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
                height={200}
                width={plotWidth}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectionsDisplay({ selections = [], displayedChannels, channelNames, cellSets, setCellSetSelection }) {
  const setFeatures = useStore((state) => state.setFeatures);
  const scrollContainerRef = useRef(null);
  const [viewMode, setViewMode] = useState('embedding');
  const [heatmapContainerWidth, setHeatmapContainerWidth] = useState(0);
  const heatmapContainerRef = useRef();
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const colorScheme = d3.scaleOrdinal(d3.schemeObservable10).domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const PLOT_SIZE = 75;
  const allSelections = useMemo(() => {
    // Return everything in cellSets.tree that has members
    return cellSets?.tree?.flatMap((cellSet, index) => {
      const cellSetColor = colorScheme(index + 1);
      return cellSet.children
        .filter(child => child.set && child.set.length > 0) // Only include sets with members
        .map(child => ({ path: [cellSet.name, child.name], color: cellSetColor }));
    });
  }, [cellSets]);

  // Update width measurement logic to run after DOM updates
  useEffect(() => {
    const updateWidth = () => {
      if (heatmapContainerRef.current) {
        const width = heatmapContainerRef.current.getBoundingClientRect().width;
        setHeatmapContainerWidth(width);
      }
    };

    // Use ResizeObserver for more reliable width measurements
    const resizeObserver = new ResizeObserver(updateWidth);
    if (heatmapContainerRef.current) {
      resizeObserver.observe(heatmapContainerRef.current);
    }

    // Initial measurement
    updateWidth();

    return () => {
      resizeObserver.disconnect();
    };
  }, [setFeatures]);

  const handleViewChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const [rectWidth, setRectWidth] = useState(0);
  const compareMode = useStore((state) => state.compareMode);
  const [compareSelections, setCompareSelections] = useState([]);

  useEffect(() => {
    if (!allSelections?.length || !setFeatures) {
      setRectWidth(0);
      return;
    }
    const featureData = setFeatures[allSelections[0]?.path?.[0]]?.[allSelections[0]?.path?.[1]];
    if (!featureData?.feat_imp?.length) {
      setRectWidth(0);
      return;
    }
    setRectWidth(heatmapContainerWidth / featureData.feat_imp.length);
  }, [selections, allSelections, setFeatures, heatmapContainerWidth]);

  // Helper function to check if a selection is currently visible
  const isSelectionVisible = (selectionPath) => {
    return selections?.some(sel =>
      sel[0] === selectionPath[0] && sel[1] === selectionPath[1]
    );
  };

  // Update the sortedSelections useMemo to ensure we're not including empty sets
  const sortedSelections = useMemo(() => {
    if (!allSelections || !setFeatures) return allSelections;

    return [...allSelections]
      .filter(selection => {
        // Check if the set has features data and members
        const featureData = setFeatures[selection.path[0]]?.[selection.path[1]];
        return featureData && featureData.feat_imp?.length > 0;
      })
      .sort((a, b) => {
        // When not in compare mode, prioritize visible selections
        if (!compareMode) {
          const aVisible = isSelectionVisible(a.path);
          const bVisible = isSelectionVisible(b.path);
          if (aVisible !== bVisible) {
            return bVisible ? 1 : -1;
          }
        }

        // Sort by the feature importance if sortBy is present
        if (sortBy) {
          const aData = setFeatures[a.path[0]]?.[a.path[1]]?.feat_imp;
          const bData = setFeatures[b.path[0]]?.[b.path[1]]?.feat_imp;

          if (!aData || !bData) return 0;

          const aValue = aData.find(d => d[0] === sortBy)?.[1] || 0;
          const bValue = bData.find(d => d[0] === sortBy)?.[1] || 0;

          return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
        }
        return 0;
      });
  }, [allSelections, setFeatures, sortBy, sortDirection, compareMode, selections]);

  // Handle visibility toggle
  const handleVisibilityToggle = (selectionPath) => {
    const isVisible = isSelectionVisible(selectionPath);
    if (isVisible) {
      // Remove from selection
      setCellSetSelection(selections.filter(sel =>
        !(sel[0] === selectionPath[0] && sel[1] === selectionPath[1])
      ));
    } else {
      // Add to selection
      setCellSetSelection([...selections, selectionPath]);
    }
  };

  const [comparisonResults, setComparisonResults] = useState(null);

  // Fetch comparison results when selections change
  useEffect(() => {
    if (!compareSelections || compareSelections.length !== 2 || !cellSets) return;

    const set1 = treeFindNodeByNamePath(cellSets, compareSelections[0].path);
    const set2 = treeFindNodeByNamePath(cellSets, compareSelections[1].path);

    if (!set1 || !set2) return;

    let mounted = true;

    const fetchComparisonResults = async () => {
      try {
        const response = await fetch("http://localhost:8181/set-compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sets: [
              {
                selection_ids: set1.set.map(cell => [cell[0]]),
                path: compareSelections[0].path
              },
              {
                selection_ids: set2.set.map(cell => [cell[0]]),
                path: compareSelections[1].path
              }
            ]
          }),
        });
        const responseData = await response.json();
        if (mounted) {
          setComparisonResults({
            operations: responseData.data.operations,
            set1,
            set2,
            set1_count: responseData.data.set1_count,
            set2_count: responseData.data.set2_count
          });
        }
      } catch (error) {
        console.error("Error fetching comparison results:", error);
        if (mounted) {
          setComparisonResults(null);
        }
      }
    };

    fetchComparisonResults();

    return () => {
      mounted = false;
    };
  }, [compareSelections, cellSets]);

  // Clear comparison results when exiting compare mode
  useEffect(() => {
    if (!compareMode) {
      setComparisonResults(null);
    }
  }, [compareMode]);

  const handleRowClick = (selection) => {
    if (!compareMode) return;

    setCompareSelections(prev => {
      if (prev.length === 2) {
        // If already have 2 selections, don't add more
        return prev;
      } else if (prev.find(s => s.path[0] === selection.path[0] && s.path[1] === selection.path[1])) {
        // If clicking an already selected row, remove it
        return prev.filter(s => !(s.path[0] === selection.path[0] && s.path[1] === selection.path[1]));
      } else {
        // Add the new selection if less than 2 items are selected
        if (prev.length === 0) {
          return [selection];
        } else {
          return [...prev, selection];
        }
      }
    });
  };

  // Effect to update visible selections when in compare mode
  useEffect(() => {
    if (compareMode) {
      const selectionPaths = compareSelections.map(s => s.path);
      setCellSetSelection(selectionPaths);
    }
  }, [compareSelections, compareMode]);


  return (
    <div style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
    }}>
    

      {/* Main content area - added ref */}
      <div 
        ref={scrollContainerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '2px',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          paddingBottom: '0',
        }}
      >
        <StickyHeader
          viewMode={viewMode}
          handleViewChange={handleViewChange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          featureData={setFeatures[selections?.[0]?.[0]]?.[selections?.[0]?.[1]]}
          rectWidth={rectWidth}
          displayedChannels={displayedChannels}
          channelNames={channelNames}
          compareMode={compareMode}
          onCompareToggle={() => {
            setCompareMode(prev => !prev);
            setCompareSelections([]);
            setCellSetSelection(selections);
          }}
          height={scrollContainerRef.current?.clientHeight}
          plotSize={PLOT_SIZE}
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            padding: '5px',
            position: 'sticky',
            left: 0,
            zIndex: 1,
          }}
        />

        {/* Only show the comparison UI when in compare mode */}
        {compareMode ? (
          <>
            {/* Selected sets */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '2px' }}>
              {sortedSelections?.filter(selection =>
                compareSelections.some(s =>
                  s.path[0] === selection.path[0] && s.path[1] === selection.path[1]
                )
              ).map((selection, i) => (
                <SelectionColumn
                  key={`selected-${i}`}
                  selection={selection}
                  setFeatures={setFeatures}
                  viewMode={viewMode}
                  PLOT_SIZE={PLOT_SIZE}
                  heatmapContainerWidth={heatmapContainerWidth}
                  heatmapContainerRef={heatmapContainerRef}
                  isVisible={isSelectionVisible(selection.path)}
                  onVisibilityToggle={() => handleVisibilityToggle(selection.path)}
                  onClick={() => handleRowClick(selection)}
                  style={{ backgroundColor: '#2C3E50' }}
                  colorScheme={colorScheme}
                  cellSets={cellSets}
                  compareMode={compareMode}
                />
              ))}
            </div>

            {/* Set operation icons */}
            {compareMode && compareSelections.length === 2 && (
              <div style={{
                padding: '4px',
                backgroundColor: 'rgba(30, 30, 30, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: '2px',
                marginRight: '2px'
              }}>
                {Object.keys(OPERATION_NAMES).map((operation) => (
                  <SetOperationIcon
                    key={operation}
                    type={operation}
                    size={30}
                    disabled={!comparisonResults?.operations?.[operation]}
                  />
                ))}
              </div>
            )}

            {/* Derived sets from comparison */}
            {compareMode && comparisonResults?.operations && (
              Object.entries(comparisonResults.operations)
                .filter(([_, value]) => value.count > 0)
                .map(([operation, value], i) => (
                  <SelectionColumn
                    key={`comparison-${i}`}
                    selection={{
                      path: [`${OPERATION_NAMES[operation]}`, `${value.count} cells`]
                    }}
                    setFeatures={{
                      [OPERATION_NAMES[operation]]: {
                        [`${value.count} cells`]: value.data
                      }
                    }}
                    viewMode={viewMode}
                    PLOT_SIZE={PLOT_SIZE}
                    heatmapContainerWidth={heatmapContainerWidth}
                    heatmapContainerRef={heatmapContainerRef}
                    isVisible={true}
                    onVisibilityToggle={() => { }}
                    onClick={() => { }}
                    style={{
                      backgroundColor: `${iconConfigs[operation]?.color}99`,
                      marginBottom: '2px',
                      marginTop: i === 0 ? '8px' : '2px',
                    }}
                    colorScheme={colorScheme}
                    cellSets={cellSets}
                    compareMode={compareMode}
                  />
                ))
            )}

            {/* Unselected sets */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '2px' }}>
              {sortedSelections?.filter(selection =>
                !compareSelections.some(s =>
                  s.path[0] === selection.path[0] && s.path[1] === selection.path[1]
                )
              ).map((selection, i) => (
                <SelectionColumn
                  key={`unselected-${i}`}
                  selection={selection}
                  setFeatures={setFeatures}
                  viewMode={viewMode}
                  PLOT_SIZE={PLOT_SIZE}
                  heatmapContainerWidth={heatmapContainerWidth}
                  heatmapContainerRef={heatmapContainerRef}
                  isVisible={isSelectionVisible(selection.path)}
                  onVisibilityToggle={() => handleVisibilityToggle(selection.path)}
                  onClick={() => handleRowClick(selection)}
                  style={{ backgroundColor: '#1A1A1A', opacity: 0.3 }}
                  colorScheme={colorScheme}
                  cellSets={cellSets}
                  compareMode={compareMode}
                />
              ))}
            </div>
          </>
        ) : (
          // Regular view (not compare mode)
          sortedSelections?.map((selection, i) => (
            <Card
              key={i}
              variant="outlined"
              style={{
                backgroundColor: isSelectionVisible(selection.path) ? '#1A1A1A' : '#121212',
                borderColor: '#333333',
                padding: 1,
                marginRight: '2px',
                opacity: isSelectionVisible(selection.path) ? 1 : 0.5,
                display: 'inline-block',
                height: '100%',
                width: 'auto',
                flex: '1 0 auto',
                minWidth: `${PLOT_SIZE * 2}px`,
              }}
            >
              <CardContent style={{
                padding: 0,
                height: '100%',
                width: '100%',
              }}>
                <SelectionColumn
                  selection={selection}
                  setFeatures={setFeatures}
                  viewMode={viewMode}
                  PLOT_SIZE={PLOT_SIZE}
                  heatmapContainerWidth={heatmapContainerWidth}
                  heatmapContainerRef={heatmapContainerRef}
                  isVisible={isSelectionVisible(selection.path)}
                  onVisibilityToggle={() => handleVisibilityToggle(selection.path)}
                  onClick={() => handleRowClick(selection)}
                  colorScheme={colorScheme}
                  cellSets={cellSets}
                  compareMode={compareMode}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function SelectionsSummarySubscriber(props) {
  const { coordinationScopes, title: titleOverride, theme } = props;

  const [{
    obsType,
    obsSetSelection,
    obsSetColor,
    spatialImageLayer,
    dataset,
    additionalObsSets
  }, {
    setSpatialImageLayer,
    setObsSetSelection,
    setObsSetColor
  }] = useCoordination(
    [
      ...COMPONENT_COORDINATION_TYPES[ViewType.OBS_SETS],
      ...COMPONENT_COORDINATION_TYPES[ViewType.SPATIAL],
      ct.SPATIAL_IMAGE_LAYER
    ],
    coordinationScopes
  );

  // Get data from loaders using the data hooks
  const [{ obsIndex, obsSets: cellSets }, obsSetsStatus, obsSetsUrls] = useObsSetsData(
    loaders, dataset, false,
    { setObsSetSelection, setObsSetColor },
    { obsSetSelection, obsSetColor },
    { obsType },
  );

  // Merge the cell sets with additional sets
  const mergedCellSets = useMemo(
    () => mergeObsSets(cellSets, additionalObsSets),
    [cellSets, additionalObsSets],
  );

  const [{ image }, _] = useImageData(
    loaders,
    dataset,
    false,
    { setSpatialImageLayer },
    { spatialImageLayer },
    {} // TODO: which values to match on
  );

  const [displayedChannels, setDisplayedChannels] = useState([]);
  const [channelNames, setChannelNames] = useState([]);
  const { loaders: imageLayerLoaders, meta: imageLayerMeta } = image || {};
  useEffect(() => {
    if (!imageLayerLoaders) return;
    setChannelNames(imageLayerLoaders?.[0]?.channels);
  }, [imageLayerLoaders]);
  useEffect(() => {
    if (spatialImageLayer && spatialImageLayer.length > 0) {
      // Get the first image layer
      const firstLayer = spatialImageLayer[0];

      // Log channel information
      const channels = firstLayer.channels.map((channel, index) => {
        return {
          color: channel.color, // RGB color array
          contrastLimits: channel.slider, // [min, max] contrast limits
          visible: channel.visible,
          selection: channel.selection,
        }
      });
      setDisplayedChannels(channels);
    }
  }, [spatialImageLayer, imageLayerLoaders, imageLayerMeta, image]);

  const title = titleOverride || `${capitalize(obsType)} Selections`;

  return (

    <div style={{
      backgroundColor: '#121212',
      color: '#ffffff',
      height: '100%'
    }}>
      <SelectionsDisplay
        selections={obsSetSelection}
        cellSets={mergedCellSets}
        setCellSetSelection={setObsSetSelection}
        displayedChannels={displayedChannels}
        channelNames={channelNames}
      />
    </div>
  );
}

export default SelectionsDisplay;