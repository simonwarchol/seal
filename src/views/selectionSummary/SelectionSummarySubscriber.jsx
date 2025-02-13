import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useCoordination, TitleInfo, useLoaders, useImageData, useObsSetsData } from '@vitessce/vit-s';
import { COMPONENT_COORDINATION_TYPES, ViewType, CoordinationType as ct } from '@vitessce/constants-internal';
import { capitalize } from '@vitessce/utils';
import { treeFindNodeByNamePath } from '@vitessce/sets-utils';
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
  'a_plus_b_minus_intersection': 'Symmetric difference',
  'a_plus_b': 'Union',
  'complement': 'Complement'
};

function SelectionsDisplay({ selections, displayedChannels, channelNames, cellSets, setCellSetSelection }) {
  const setFeatures = useStore((state) => state.setFeatures);
  const [viewMode, setViewMode] = useState('embedding');
  const headerRef = useRef();
  const [heatmapContainerWidth, setHeatmapContainerWidth] = useState(0);
  const heatmapContainerRef = useRef();
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const colorScheme = d3.scaleOrdinal(d3.schemeObservable10).domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const PLOT_SIZE = 50;
  const allSelections = useMemo(() => {
    // Return everything in cellSets.tree 
    return cellSets?.tree?.flatMap((cellSet, index) => {
      const cellSetColor = colorScheme(index + 1);
      return cellSet.children.map(child => ({ path: [cellSet.name, child.name], color: cellSetColor }));
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

  // Update the sortedSelections useMemo to prioritize visible items
  const sortedSelections = useMemo(() => {
    if (!allSelections) return allSelections;

    return [...allSelections].sort((a, b) => {
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
  }, [allSelections, setFeatures, sortBy, sortDirection]);

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

  const [compareMode, setCompareMode] = useState(false);
  const [compareSelections, setCompareSelections] = useState([]);

  const handleCompareToggle = () => {
    if (compareMode) {
      setCompareMode(false);
      setCompareSelections([]);
      setCellSetSelection(selections);
    } else {
      setCompareMode(true);
      setCellSetSelection([]);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative', margin: 0 }}>
      <StickyHeader
        viewMode={viewMode}
        handleViewChange={handleViewChange}
        headerRef={headerRef}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        featureData={setFeatures[selections?.[0]?.[0]]?.[selections?.[0]?.[1]]}
        rectWidth={rectWidth}
        displayedChannels={displayedChannels}
        channelNames={channelNames}
        compareMode={compareMode}
        onCompareToggle={handleCompareToggle}
        height={PLOT_SIZE}
      />

      {/* Only show the comparison UI when in compare mode */}
      {compareMode ? (
        <>
          {/* Selected sets */}
          {sortedSelections?.filter(selection =>
            compareSelections.some(s =>
              s.path[0] === selection.path[0] && s.path[1] === selection.path[1]
            )
          ).map((selection, i) => (
            <div
              key={`selected-${i}`}
              onClick={() => handleRowClick(selection)}
              style={{
                backgroundColor: '#2C3E50',
                padding: '5px',
                marginBottom: '2px',
                cursor: compareMode ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" style={{ color: '#ffffff', fontSize: '0.7rem' }}>
                    <span style={{ color: colorScheme(cellSets?.tree?.findIndex(child => child.name === selection.path[0]) + 1) }}>{selection?.path?.[0]}</span>
                    {'-'}
                    <span>{selection?.path?.[1]}</span>
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVisibilityToggle(selection.path);
                    }}
                    style={{
                      padding: 4,
                      position: 'relative',
                      visibility: compareMode ? 'hidden' : 'visible'
                    }}
                  >
                    {isSelectionVisible(selection.path) ? (
                      <VisibilityOutlined style={{ fontSize: 16, color: '#ffffff' }} />
                    ) : (
                      <VisibilityOffOutlined style={{ fontSize: 16, color: '#666666' }} />
                    )}
                  </IconButton>
                </div>
                {setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.feat_imp && (
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', height: PLOT_SIZE }}>
                    <div style={{ width: `${PLOT_SIZE}px`, height: '100%', padding: 0, margin: 0, lineHeight: 0 }}>
                      {viewMode === 'embedding' ? (
                        <ScatterPlot
                          data={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.embedding_coordinates}
                          backgroundData={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_subsample}
                          ranges={[
                            [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[0][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[0][1]],
                            [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[1][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[1][1]]
                          ]}
                          height={PLOT_SIZE}
                          width={PLOT_SIZE}
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
                          title="Spatial"
                        />
                      )}
                    </div>
                    <div
                      ref={heatmapContainerRef}
                      style={{ flex: 1, overflow: 'hidden' }}
                    >
                      <FeatureHeatmap
                        featureData={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
                        height={PLOT_SIZE}
                        width={heatmapContainerWidth}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Set operation icons */}
          {compareMode && compareSelections.length === 2 && (
            <div style={{
              padding: '4px 0',
              backgroundColor: 'rgba(30, 30, 30, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '2px',
              marginBottom: '2px'
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
                <div
                  key={`comparison-${i}`}
                  style={{
                    backgroundColor: `${iconConfigs[operation]?.color}99`, // Added 99 for ~60% opacity
                    padding: '5px',
                    marginBottom: '2px',
                    marginTop: i === 0 ? '8px' : '2px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="subtitle2"
                      style={{
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        marginBottom: '4px'
                      }}
                    >
                      {OPERATION_NAMES[operation]} ({value.count} cells)
                    </Typography>
                    <div style={{ height: PLOT_SIZE, display: 'flex', gap: '2px' }}>
                      <div style={{ width: PLOT_SIZE, height: PLOT_SIZE }}>
                        {viewMode === 'embedding' ? (
                          <ScatterPlot
                            data={value.data.embedding_coordinates}
                            backgroundData={value.data.summary.embedding_subsample}
                            ranges={[
                              [value.data.summary.embedding_ranges[0][0], value.data.summary.embedding_ranges[0][1]],
                              [value.data.summary.embedding_ranges[1][0], value.data.summary.embedding_ranges[1][1]]
                            ]}
                            height={PLOT_SIZE}
                            width={PLOT_SIZE}
                            title="Embedding"
                          />
                        ) : (
                          <ScatterPlot
                            data={value.data.spatial_coordinates}
                            backgroundData={value.data.summary.spatial_subsample}
                            ranges={[
                              [value.data.summary.spatial_ranges[0][0], value.data.summary.spatial_ranges[0][1]],
                              [value.data.summary.spatial_ranges[1][0], value.data.summary.spatial_ranges[1][1]]
                            ]}
                            height={PLOT_SIZE}
                            width={PLOT_SIZE}
                            title="Spatial"
                          />
                        )}
                      </div>
                      <div
                        ref={heatmapContainerRef}
                        style={{ flex: 1, overflow: 'hidden' }}
                      >
                        <FeatureHeatmap
                          featureData={value.data}
                          height={PLOT_SIZE}
                          width={heatmapContainerWidth}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}

          {/* Unselected sets */}
          {sortedSelections?.filter(selection =>
            !compareSelections.some(s =>
              s.path[0] === selection.path[0] && s.path[1] === selection.path[1]
            )
          ).map((selection, i) => (
            <div
              key={`unselected-${i}`}
              onClick={() => handleRowClick(selection)}
              style={{
                backgroundColor: '#1A1A1A',
                padding: '5px',
                marginBottom: '2px',
                cursor: compareMode ? 'pointer' : 'default',
                opacity: 0.3
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" style={{ color: '#ffffff', fontSize: '0.7rem' }}>
                    <span style={{ color: colorScheme(cellSets?.tree?.findIndex(child => child.name === selection.path[0]) + 1) }}>{selection?.path?.[0]}</span>
                    {'-'}
                    <span>{selection?.path?.[1]}</span>
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVisibilityToggle(selection.path);
                    }}
                    style={{
                      padding: 4,
                      position: 'relative',
                      visibility: compareMode ? 'hidden' : 'visible'
                    }}
                  >
                    {isSelectionVisible(selection.path) ? (
                      <VisibilityOutlined style={{ fontSize: 16, color: '#ffffff' }} />
                    ) : (
                      <VisibilityOffOutlined style={{ fontSize: 16, color: '#666666' }} />
                    )}
                  </IconButton>
                </div>
                {setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.feat_imp && (
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', height: PLOT_SIZE }}>
                    <div style={{ width: `${PLOT_SIZE}px`, height: '100%', padding: 0, margin: 0, lineHeight: 0 }}>
                      {viewMode === 'embedding' ? (
                        <ScatterPlot
                          data={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.embedding_coordinates}
                          backgroundData={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_subsample}
                          ranges={[
                            [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[0][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[0][1]],
                            [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[1][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[1][1]]
                          ]}
                          height={PLOT_SIZE}
                          width={PLOT_SIZE}
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
                          title="Spatial"
                        />
                      )}
                    </div>
                    <div
                      ref={heatmapContainerRef}
                      style={{ flex: 1, overflow: 'hidden' }}
                    >
                      <FeatureHeatmap
                        featureData={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
                        height={PLOT_SIZE}
                        width={heatmapContainerWidth}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      ) : (
        // Regular view (not compare mode)
        sortedSelections?.map((selection, i) => (
          <Card
            key={i}
            variant="outlined"
            onClick={() => handleRowClick(selection)}
            style={{
              backgroundColor: '#2C3E50',
              borderColor: '#333333',
              padding: 1,
              marginBottom: '2px',
              cursor: 'pointer',
            }}
          >
            <CardContent style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" style={{ color: '#ffffff', fontSize: '0.7rem' }}>
                    <span style={{ color: colorScheme(cellSets?.tree?.findIndex(child => child.name === selection.path[0]) + 1) }}>{selection?.path?.[0]}</span>
                    {'-'}
                    <span>{selection?.path?.[1]}</span>
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVisibilityToggle(selection.path);
                    }}
                    style={{ padding: 4 }}
                  >
                    {isSelectionVisible(selection.path) ? (
                      <VisibilityOutlined style={{ fontSize: 16, color: '#ffffff' }} />
                    ) : (
                      <VisibilityOffOutlined style={{ fontSize: 16, color: '#666666' }} />
                    )}
                  </IconButton>
                </div>
                {setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.feat_imp && (
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', height: PLOT_SIZE }}>
                    <div style={{ width: `${PLOT_SIZE}px`, height: '100%', padding: 0, margin: 0, lineHeight: 0 }}>
                      {viewMode === 'embedding' ? (
                        <ScatterPlot
                          data={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.embedding_coordinates}
                          backgroundData={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_subsample}
                          ranges={[
                            [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[0][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[0][1]],
                            [setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[1][0], setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]?.summary.embedding_ranges[1][1]]
                          ]}
                          height={PLOT_SIZE}
                          width={PLOT_SIZE}
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
                          title="Spatial"
                        />
                      )}
                    </div>
                    <div
                      ref={heatmapContainerRef}
                      style={{ flex: 1, overflow: 'hidden' }}
                    >
                      <FeatureHeatmap
                        featureData={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
                        height={PLOT_SIZE}
                        width={heatmapContainerWidth}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export function SelectionsSummarySubscriber(props) {
  const { coordinationScopes, title: titleOverride, theme } = props;

  const [{ obsType, obsSetSelection, obsSetColor, spatialImageLayer, dataset }, { setSpatialImageLayer, setObsSetSelection, setObsSetColor }] = useCoordination(
    [
      ...COMPONENT_COORDINATION_TYPES[ViewType.OBS_SETS],
      ...COMPONENT_COORDINATION_TYPES[ViewType.SPATIAL],
      ct.SPATIAL_IMAGE_LAYER
    ],
    coordinationScopes
  );

  // Get data from loaders using the data hooks.
  const [{ obsSets: cellSets },] = useObsSetsData(
    loaders, dataset, false,
    { setObsSetSelection: setObsSetSelection, setObsSetColor: setObsSetColor },
    { obsSetSelection: obsSetSelection, obsSetColor: obsSetColor },
    { obsType },
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
      <SelectionsDisplay
        selections={obsSetSelection}
        cellSets={cellSets}
        setCellSetSelection={setObsSetSelection}
        displayedChannels={displayedChannels}
        channelNames={channelNames}
      />
    </TitleInfo>
  );
}

export default SelectionsDisplay;