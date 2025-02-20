import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useCoordination, TitleInfo, useLoaders, useImageData, useObsSetsData, useAuxiliaryCoordination, useObsLocationsData, useObsSegmentationsData, useReady, useClosestVitessceContainerSize, useWindowDimensions, useComponentLayout } from '@vitessce/vit-s';
import { COMPONENT_COORDINATION_TYPES, ViewType, CoordinationType as ct } from '@vitessce/constants-internal';
import { capitalize } from '@vitessce/utils';
import { treeFindNodeByNamePath, mergeObsSets } from '@vitessce/sets-utils';
import { Card, CardContent, Typography, Tabs, Tab } from '@material-ui/core';
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
import { Close as CloseIcon } from '@mui/icons-material';
import { LayerControllerMemoized } from '../controller/LayerControllerSubscriber';
import { DEFAULT_RASTER_LAYER_PROPS } from "@vitessce/spatial-utils";


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
  setFeature,
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
  compareMode,
  importanceColorScale,
  occuranceColorScale,
  importanceInColor,
  setImportanceInColor,
  fromRegularSelections = false
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
        {setFeature?.feat_imp && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ height: `${PLOT_SIZE}px`, padding: 0, margin: 0, lineHeight: 0 }}>
              {viewMode === 'embedding' ? (
                <ScatterPlot
                  data={setFeature?.embedding_coordinates}
                  backgroundData={setFeature?.summary.embedding_subsample}
                  ranges={[
                    [setFeature?.summary.embedding_ranges[0][0], setFeature?.summary.embedding_ranges[0][1]],
                    [setFeature?.summary.embedding_ranges[1][0], setFeature?.summary.embedding_ranges[1][1]]
                  ]}
                  height={PLOT_SIZE}
                  width={plotWidth}
                  title="Embedding"
                />
              ) : (
                <ScatterPlot
                  data={setFeature?.spatial_coordinates}
                  backgroundData={setFeature?.summary.spatial_subsample}
                  ranges={[
                    [setFeature?.summary.spatial_ranges[0][0], setFeature?.summary.spatial_ranges[0][1]],
                    [setFeature?.summary.spatial_ranges[1][0], setFeature?.summary.spatial_ranges[1][1]]
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
                featureData={setFeature}
                height={200}
                width={plotWidth}
                importanceColorScale={importanceColorScale}
                occuranceColorScale={occuranceColorScale}
                importanceInColor={importanceInColor}
                setImportanceInColor={setImportanceInColor}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectionsDisplay({ selections = [], displayedChannels, channelNames, cellSets, setCellSetSelection, rasterLayers, setRasterLayers, cellsLayer, setCellsLayer, imageLayerLoaders, imageLayerMeta, isReady, imageLayerCallbacks, setImageLayerCallbacks, areLoadingImageChannels, setAreLoadingImageChannels, handleRasterLayerChange, handleRasterLayerRemove, handleSegmentationLayerChange, handleSegmentationLayerRemove, layerControllerRef, moleculesLayer, setMoleculesLayer, closeButtonVisible, downloadButtonVisible, removeGridComponent, theme, title, disable3d, globalDisable3d, disableChannelsIfRgbDetected, enableLayerButtonsWithOneLayer, dataset, obsType, segmentationLayerLoaders, segmentationLayerMeta, segmentationLayerCallbacks, setSegmentationLayerCallbacks, areLoadingSegmentationChannels, setAreLoadingSegmentationChannels, componentHeight, componentWidth, spatialLayout, layerIs3DIndex, setZoom, setTargetX, setTargetY, setTargetZ, setRotationX, setRotationOrbit, obsSegmentationsType, additionalObsSets }) {
  // Move all useStore calls to the top of the component
  const setFeatures = useStore((state) => state.setFeatures);
  const compareMode = useStore((state) => state.compareMode);
  const importanceInColor = useStore((state) => state.importanceInColor);
  const setImportanceInColor = useStore((state) => state.setImportanceInColor);
  const setCompareMode = useStore((state) => state.setCompareMode);
  const viewMode = useStore((state) => state.viewMode);
  const scrollContainerRef = useRef(null);
  const [heatmapContainerWidth, setHeatmapContainerWidth] = useState(0);
  const heatmapContainerRef = useRef();
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const colorScheme = d3.scaleOrdinal(d3.schemeObservable10).domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const PLOT_SIZE = 75;
  console.log('setFeatures', setFeatures?.['My Selections']);
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
  const [compareSelections, setCompareSelections] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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
          let aValue, bValue;
          if (importanceInColor) {
            aValue = setFeatures[a.path[0]]?.[a.path[1]]?.feat_imp.find(d => d[0] === sortBy)?.[1] || 0;
            bValue = setFeatures[b.path[0]]?.[b.path[1]]?.feat_imp.find(d => d[0] === sortBy)?.[1] || 0;
          } else {
            aValue = setFeatures[a.path[0]]?.[a.path[1]]?.normalized_occurrence[sortBy] || 0;
            bValue = setFeatures[b.path[0]]?.[b.path[1]]?.normalized_occurrence[sortBy] || 0;
          }

          if (!aValue || !bValue) return 0;



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

  // Create color scales for the legend and heatmap
  const importanceColorScale = useMemo(() => {
    if (!setFeatures[selections?.[0]?.[0]]?.[selections?.[0]?.[1]]?.feat_imp) return () => "#000000"; // Return a default function
    const sortedFeatures = [...setFeatures[selections?.[0]?.[0]]?.[selections?.[0]?.[1]]?.feat_imp].sort((a, b) => a[0].localeCompare(b[0]));
    return d3.scaleSequential()
      .domain([0, d3.max(sortedFeatures, d => d[1])])
      .interpolator(d3.interpolateViridis);
  }, [setFeatures, selections]);

  // Interpolate between #00E5D3, to #0C074E, to #DD94C5
  const occuranceColorScale = useMemo(() =>
    d3.scaleLinear()
      .domain([-1, 0, 1])
      .range(['#00E5D3', '#0C074E', '#DD94C5'])
      .interpolate(d3.interpolateRgb)
    , []);

  function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && children}
      </div>
    );
  }

  const handleImageAdd = useCallback(
    (newLayer) => {
      const newLayers = [...(rasterLayers || [])];
      newLayers.push({
        ...DEFAULT_RASTER_LAYER_PROPS,
        ...newLayer,
      });
      setRasterLayers(newLayers);
    },
    [rasterLayers, setRasterLayers]
  );

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '300px',
        height: '100%',
        overflow: 'auto',
        backgroundColor: '#1a1a1a',
        transform: `translateX(${isPanelOpen ? '0' : '-500px'})`,
        transition: 'transform 0.3s ease-in-out',
        zIndex: 999,
        borderRight: '1px solid #333333',
      }}>
        
        <div style={{ padding: '0', color: '#ffffff', margin:0 }}>
          <LayerControllerMemoized
            simon={true}
            ref={layerControllerRef}
            title={''}
            closeButtonVisible={closeButtonVisible}
            downloadButtonVisible={downloadButtonVisible}
            removeGridComponent={removeGridComponent}
            theme={theme}
            isReady={isReady}
            moleculesLayer={moleculesLayer}
            dataset={dataset}
            obsType={obsType}
            setMoleculesLayer={setMoleculesLayer}
            cellsLayer={cellsLayer}
            setCellsLayer={setCellsLayer}
            rasterLayers={rasterLayers}
            imageLayerLoaders={imageLayerLoaders}
            imageLayerMeta={imageLayerMeta}
            imageLayerCallbacks={imageLayerCallbacks}
            setImageLayerCallbacks={setImageLayerCallbacks}
            areLoadingImageChannels={areLoadingImageChannels}
            setAreLoadingImageChannels={setAreLoadingImageChannels}
            handleRasterLayerChange={handleRasterLayerChange}
            handleRasterLayerRemove={handleRasterLayerRemove}
            obsSegmentationsType={obsSegmentationsType}
            segmentationLayerLoaders={segmentationLayerLoaders}
            segmentationLayerMeta={segmentationLayerMeta}
            segmentationLayerCallbacks={segmentationLayerCallbacks}
            setSegmentationLayerCallbacks={setSegmentationLayerCallbacks}
            areLoadingSegmentationChannels={areLoadingSegmentationChannels}
            setAreLoadingSegmentationChannels={setAreLoadingSegmentationChannels}
            handleSegmentationLayerChange={handleSegmentationLayerChange}
            handleSegmentationLayerRemove={handleSegmentationLayerRemove}
            disable3d={disable3d}
            globalDisable3d={globalDisable3d}
            layerIs3DIndex={layerIs3DIndex}
            disableChannelsIfRgbDetected={disableChannelsIfRgbDetected}
            enableLayerButtonsWithOneLayer={enableLayerButtonsWithOneLayer}
            setZoom={setZoom}
            setTargetX={setTargetX}
            setTargetY={setTargetY}
            setTargetZ={setTargetZ}
            setRotationX={setRotationX}
            setRotationOrbit={setRotationOrbit}
            componentHeight={componentHeight || windowHeight}
            componentWidth={componentWidth || windowWidth}
            spatialLayout={spatialLayout}
            handleImageAdd={handleImageAdd}
            additionalObsSets={additionalObsSets}
          />
        </div>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        marginLeft: isPanelOpen ? '300px' : '0',
        transition: 'margin-left 0.3s ease-in-out',
      }}>
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
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            featureData={setFeatures[selections?.[0]?.[0]]?.[selections?.[0]?.[1]]}
            rectWidth={rectWidth}
            height={scrollContainerRef.current?.clientHeight}
            plotSize={PLOT_SIZE}
            importanceColorScale={importanceColorScale}
            occuranceColorScale={occuranceColorScale}
            importanceInColor={importanceInColor}
            setImportanceInColor={setImportanceInColor}
            isPanelOpen={isPanelOpen}
            onPanelToggle={setIsPanelOpen}
          />

          {/* Only show the comparison UI when in compare mode */}
          {compareMode ? (
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '2px',
              height: '100%',
              flex: 1
            }}>
              {/* Selected sets */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '2px',
                height: '100%'
              }}>
                {sortedSelections?.filter(selection =>
                  compareSelections.some(s =>
                    s.path[0] === selection.path[0] && s.path[1] === selection.path[1]
                  )
                ).map((selection, i) => (
                  <Card
                    key={`selected-${i}`}
                    variant="outlined"
                    style={{
                      backgroundColor: '#2C3E50',
                      borderColor: '#333333',
                      padding: 1,
                      marginRight: '2px',
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
                        setFeature={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
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
                        importanceColorScale={importanceColorScale}
                        occuranceColorScale={occuranceColorScale}
                        importanceInColor={importanceInColor}
                        setImportanceInColor={setImportanceInColor}
                      />
                    </CardContent>
                  </Card>
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
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '2px',
                  height: '100%'
                }}>
                  {Object.entries(comparisonResults.operations)
                    .filter(([_, value]) => value.count > 0)
                    .map(([operation, value], i) => (
                      <Card
                        key={`comparison-${i}`}
                        variant="outlined"
                        style={{
                          backgroundColor: `${iconConfigs[operation]?.color}99`,
                          borderColor: '#333333',
                          padding: 1,
                          marginRight: '2px',
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
                            selection={{
                              path: [`${OPERATION_NAMES[operation]}`, `${value.count} cells`]
                            }}
                            setFeature={setFeatures[OPERATION_NAMES[operation]]?.[`${value.count} cells`]}
                            viewMode={viewMode}
                            PLOT_SIZE={PLOT_SIZE}
                            heatmapContainerWidth={heatmapContainerWidth}
                            heatmapContainerRef={heatmapContainerRef}
                            isVisible={true}
                            onVisibilityToggle={() => { }}
                            onClick={() => { }}
                            colorScheme={colorScheme}
                            cellSets={cellSets}
                            compareMode={compareMode}
                            importanceColorScale={importanceColorScale}
                            occuranceColorScale={occuranceColorScale}
                            importanceInColor={importanceInColor}
                            setImportanceInColor={setImportanceInColor}
                          />
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}

              {/* Unselected sets */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '2px' }}>
                {sortedSelections?.filter(selection =>
                  !compareSelections.some(s =>
                    s.path[0] === selection.path[0] && s.path[1] === selection.path[1]
                  )
                ).map((selection, i) => (
                  <Card
                    key={`unselected-${i}`}
                    variant="outlined"
                    style={{
                      backgroundColor: '#1A1A1A',
                      borderColor: '#333333',
                      padding: 1,
                      marginRight: '2px',
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
                        setFeature={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
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
                        importanceColorScale={importanceColorScale}
                        occuranceColorScale={occuranceColorScale}
                        importanceInColor={importanceInColor}
                        setImportanceInColor={setImportanceInColor}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
                    setFeature={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
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
                    importanceColorScale={importanceColorScale}
                    occuranceColorScale={occuranceColorScale}
                    importanceInColor={importanceInColor}
                    setImportanceInColor={setImportanceInColor}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function SelectionsSummarySubscriber(props) {
  const {
    coordinationScopes,
    closeButtonVisible,
    downloadButtonVisible,
    removeGridComponent,
    theme,
    title: titleOverride,
    disable3d,
    globalDisable3d,
    disableChannelsIfRgbDetected,
    enableLayerButtonsWithOneLayer,
  } = props;

  const loaders = useLoaders();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const layerControllerRef = useRef(null);

  const [{
    obsType,
    obsSetSelection,
    obsSetColor,
    spatialImageLayer: rasterLayers,
    spatialSegmentationLayer: cellsLayer,
    spatialPointLayer: moleculesLayer,
    dataset,
    additionalObsSets
  }, {
    setSpatialImageLayer: setRasterLayers,
    setSpatialSegmentationLayer: setCellsLayer,
    setSpatialPointLayer: setMoleculesLayer,
    setObsSetSelection,
    setObsSetColor,
    setSpatialTargetX,
    setSpatialTargetY,
    setSpatialTargetZ,
    setSpatialRotationX,
    setSpatialRotationOrbit,
    setSpatialZoom,
  }] = useCoordination(
    [
      ...COMPONENT_COORDINATION_TYPES[ViewType.LAYER_CONTROLLER],
      ...COMPONENT_COORDINATION_TYPES[ViewType.OBS_SETS],
      ct.ADDITIONAL_OBS_SETS,
      ct.SPATIAL_SEGMENTATION_LAYER,
    ],
    coordinationScopes
  );


  const [displayedChannels, setDisplayedChannels] = useState([]);
  const [channelNames, setChannelNames] = useState([]);

  // Get data from loaders using the data hooks
  const [{ obsIndex, obsSets: cellSets }, obsSetsStatus, obsSetsUrls] = useObsSetsData(
    loaders, dataset, false,
    { setObsSetSelection, setObsSetColor },
    { obsSetSelection, obsSetColor },
    { obsType },
  );

  const [obsLocationsData, obsLocationsStatus] = useObsLocationsData(
    loaders,
    dataset,
    false,
    { setSpatialPointLayer: setMoleculesLayer },
    { spatialPointLayer: moleculesLayer },
    {}
  );



  const [{ obsSegmentations, obsSegmentationsType }, obsSegmentationsStatus] =
    useObsSegmentationsData(
      loaders,
      dataset,
      false,
      { setSpatialSegmentationLayer: setCellsLayer },
      { spatialSegmentationLayer: cellsLayer },
      { obsType }
    );

  const [{ image }, imageStatus] = useImageData(
    loaders,
    dataset,
    false,
    { setSpatialImageLayer: setRasterLayers },
    { spatialImageLayer: rasterLayers },
    {}
  );

  const { loaders: imageLayerLoaders, meta: imageLayerMeta } = image || {};

  useEffect(() => {
    if (!imageLayerLoaders) return;
    setChannelNames(imageLayerLoaders?.[0]?.channels);
  }, [imageLayerLoaders]);

  useEffect(() => {
    if (rasterLayers && rasterLayers.length > 0) {
      const firstLayer = rasterLayers[0];
      const channels = firstLayer.channels.map((channel, index) => ({
        color: channel.color,
        contrastLimits: channel.slider,
        visible: channel.visible,
        selection: channel.selection,
      }));
      setDisplayedChannels(channels);
    }
  }, [rasterLayers]);

  // Merge the cell sets with additional sets
  const mergedCellSets = useMemo(
    () => mergeObsSets(cellSets, additionalObsSets),
    [cellSets, additionalObsSets],
  );

  const title = titleOverride || `${capitalize(obsType)} Selections`;

  const isReady = useReady([
    obsLocationsStatus,
    obsSegmentationsStatus,
    imageStatus,
  ]);

  const [
    {
      imageLayerCallbacks,
      areLoadingImageChannels,
      segmentationLayerCallbacks,
      areLoadingSegmentationChannels,
    },
    {
      setImageLayerCallbacks,
      setAreLoadingImageChannels,
      setSegmentationLayerCallbacks,
      setAreLoadingSegmentationChannels,
    },
  ] = useAuxiliaryCoordination(
    COMPONENT_COORDINATION_TYPES.layerController,
    coordinationScopes
  );

  // Add the layer controller handlers
  const handleRasterLayerChange = useCallback(
    (newLayer, layerIndex) => {
      const newLayers = [...(rasterLayers || [])];
      newLayers[layerIndex] = newLayer;
      setRasterLayers(newLayers);
    },
    [rasterLayers, setRasterLayers]
  );

  const handleRasterLayerRemove = useCallback(
    (layerIndex) => {
      const newLayers = [...(rasterLayers || [])];
      newLayers.splice(layerIndex, 1);
      setRasterLayers(newLayers);
    },
    [rasterLayers, setRasterLayers]
  );

  const handleSegmentationLayerChange = useCallback(
    (newLayer, layerIndex) => {
      const newLayers = [...(cellsLayer || [])];
      newLayers[layerIndex] = newLayer;
      setCellsLayer(newLayers);
    },
    [cellsLayer, setCellsLayer]
  );

  const handleSegmentationLayerRemove = useCallback(
    (layerIndex) => {
      const newLayers = [...(cellsLayer || [])];
      newLayers.splice(layerIndex, 1);
      setCellsLayer(newLayers);
    },
    [cellsLayer, setCellsLayer]
  );

  const [spatialLayout] = useComponentLayout(
    "spatial",
    ["spatialImageLayer"],
    coordinationScopes
  );

  const segmentationLayerLoaders =
    obsSegmentations && obsSegmentationsType === "bitmask"
      ? obsSegmentations.loaders
      : null;
  const segmentationLayerMeta =
    obsSegmentations && obsSegmentationsType === "bitmask"
      ? obsSegmentations.meta
      : null;

  const [componentWidth, componentHeight] = useClosestVitessceContainerSize(layerControllerRef);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const handleImageAdd = useCallback(
    (newLayer) => {
      const newLayers = [...(rasterLayers || [])];
      newLayers.push({
        ...DEFAULT_RASTER_LAYER_PROPS,
        ...newLayer,
      });
      setRasterLayers(newLayers);
    },
    [rasterLayers, setRasterLayers]
  );

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
        rasterLayers={rasterLayers}
        setRasterLayers={setRasterLayers}
        cellsLayer={cellsLayer}
        setCellsLayer={setCellsLayer}
        moleculesLayer={moleculesLayer}
        setMoleculesLayer={setMoleculesLayer}
        imageLayerLoaders={imageLayerLoaders}
        imageLayerMeta={imageLayerMeta}
        isReady={isReady}
        imageLayerCallbacks={imageLayerCallbacks}
        setImageLayerCallbacks={setImageLayerCallbacks}
        areLoadingImageChannels={areLoadingImageChannels}
        setAreLoadingImageChannels={setAreLoadingImageChannels}
        handleRasterLayerChange={handleRasterLayerChange}
        handleRasterLayerRemove={handleRasterLayerRemove}
        handleSegmentationLayerChange={handleSegmentationLayerChange}
        handleSegmentationLayerRemove={handleSegmentationLayerRemove}
        layerControllerRef={layerControllerRef}
        closeButtonVisible={closeButtonVisible}
        downloadButtonVisible={downloadButtonVisible}
        removeGridComponent={removeGridComponent}
        theme={theme}
        title={title}
        disable3d={disable3d}
        globalDisable3d={globalDisable3d}
        disableChannelsIfRgbDetected={disableChannelsIfRgbDetected}
        enableLayerButtonsWithOneLayer={enableLayerButtonsWithOneLayer}
        dataset={dataset}
        obsType={obsType}
        segmentationLayerLoaders={segmentationLayerLoaders}
        segmentationLayerMeta={segmentationLayerMeta}
        segmentationLayerCallbacks={segmentationLayerCallbacks}
        setSegmentationLayerCallbacks={setSegmentationLayerCallbacks}
        areLoadingSegmentationChannels={areLoadingSegmentationChannels}
        setAreLoadingSegmentationChannels={setAreLoadingSegmentationChannels}
        componentHeight={componentHeight || windowHeight}
        componentWidth={componentWidth || windowWidth}
        spatialLayout={spatialLayout}
        layerIs3DIndex={-1}
        setZoom={setSpatialZoom}
        setTargetX={setSpatialTargetX}
        setTargetY={setSpatialTargetY}
        setTargetZ={setSpatialTargetZ}
        setRotationX={setSpatialRotationX}
        setRotationOrbit={setSpatialRotationOrbit}
        obsSegmentationsType={obsSegmentationsType}
        additionalObsSets={additionalObsSets}
      />
      {isPanelOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '300px',
          height: '100%',
          backgroundColor: '#1A1A1A',
          borderLeft: '1px solid #333333',
          zIndex: 1000,
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Typography variant="h6">Channel Configuration</Typography>
            <IconButton onClick={() => setIsPanelOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </div>
          <LayerControllerMemoized
            ref={layerControllerRef}
            title={title}
            closeButtonVisible={closeButtonVisible}
            downloadButtonVisible={downloadButtonVisible}
            removeGridComponent={removeGridComponent}
            theme={theme}
            isReady={isReady}
            moleculesLayer={moleculesLayer}
            dataset={dataset}
            obsType={obsType}
            setMoleculesLayer={setMoleculesLayer}
            cellsLayer={cellsLayer}
            setCellsLayer={setCellsLayer}
            rasterLayers={rasterLayers}
            imageLayerLoaders={imageLayerLoaders}
            imageLayerMeta={imageLayerMeta}
            imageLayerCallbacks={imageLayerCallbacks}
            setImageLayerCallbacks={setImageLayerCallbacks}
            areLoadingImageChannels={areLoadingImageChannels}
            setAreLoadingImageChannels={setAreLoadingImageChannels}
            handleRasterLayerChange={handleRasterLayerChange}
            handleRasterLayerRemove={handleRasterLayerRemove}
            obsSegmentationsType={obsSegmentationsType}

            segmentationLayerLoaders={segmentationLayerLoaders}
            segmentationLayerMeta={segmentationLayerMeta}
            segmentationLayerCallbacks={segmentationLayerCallbacks}
            setSegmentationLayerCallbacks={setSegmentationLayerCallbacks}
            areLoadingSegmentationChannels={areLoadingSegmentationChannels}
            setAreLoadingSegmentationChannels={setAreLoadingSegmentationChannels}
            handleSegmentationLayerChange={handleSegmentationLayerChange}
            handleSegmentationLayerRemove={handleSegmentationLayerRemove}
            disable3d={disable3d}
            globalDisable3d={globalDisable3d}
            layerIs3DIndex={layerIs3DIndex}
            disableChannelsIfRgbDetected={disableChannelsIfRgbDetected}
            enableLayerButtonsWithOneLayer={enableLayerButtonsWithOneLayer}
            setZoom={setSpatialZoom}
            setTargetX={setSpatialTargetX}
            setTargetY={setSpatialTargetY}
            setTargetZ={setSpatialTargetZ}
            setRotationX={setSpatialRotationX}
            setRotationOrbit={setSpatialRotationOrbit}
            componentHeight={componentHeight || windowHeight}
            componentWidth={componentWidth || windowWidth}
            spatialLayout={spatialLayout}
            handleImageAdd={handleImageAdd}
            additionalObsSets={additionalObsSets}
          />
        </div>
      )}
    </div>
  );
}

export default SelectionsDisplay;