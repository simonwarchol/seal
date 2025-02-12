import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useCoordination, TitleInfo, useLoaders, useImageData, useObsSetsData } from '@vitessce/vit-s';
import { COMPONENT_COORDINATION_TYPES, ViewType, CoordinationType as ct } from '@vitessce/constants-internal';
import { capitalize } from '@vitessce/utils';
import { Card, CardContent, Typography } from '@material-ui/core';
import useStore from "../../store";
import ScatterPlot from './ScatterPlot';
import FeatureHeatmap from './FeatureHeatmap';

import StickyHeader from './StickyHeader';
import * as d3 from 'd3';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';



function SelectionsDisplay({ selections, displayedChannels, channelNames, cellSets, setCellSetSelection }) {
  const setFeatures = useStore((state) => state.setFeatures);
  const [viewMode, setViewMode] = useState('embedding');
  const headerRef = useRef();
  const [heatmapContainerWidth, setHeatmapContainerWidth] = useState(0);
  const heatmapContainerRef = useRef();
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const colorScheme = d3.scaleOrdinal(d3.schemeObservable10).domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const allSelections = useMemo(() => {
    // Return everything in cellSets.tree 
    return cellSets?.tree?.flatMap((cellSet, index) => {
      const cellSetColor = colorScheme(index + 1);
      return cellSet.children.map(child => ({ path: [cellSet.name, child.name], color: cellSetColor }));
    });
  }, [cellSets]);
  console.log('todo, allSelections', allSelections, selections);

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
      // First sort by visibility
      const aVisible = isSelectionVisible(a.path);
      const bVisible = isSelectionVisible(b.path);
      if (aVisible !== bVisible) {
        return bVisible ? 1 : -1; // Changed to put visible items at the bottom
      }

      // Then sort by the existing sort criteria if present
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
  }, [selections, allSelections, setFeatures, sortBy, sortDirection]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative' }}>
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
      />
      {sortedSelections?.map((selection, i) => {
        const cellSetIndex = cellSets?.tree?.findIndex(
          child => child.name === selection.path[0]
        );
        const color = colorScheme(cellSetIndex + 1);
        const featureData = setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]];
        const PLOT_HEIGHT = 80;

        return (
          <Card 
            key={i} 
            variant="outlined" 
            style={{ 
              backgroundColor: isSelectionVisible(selection.path) ? '#3A3A3A' : '#1A1A1A',
              borderColor: '#333333', 
              padding: 1,
              marginBottom: '2px',
            }}
          >
            <CardContent style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" style={{ color: '#ffffff', fontSize: '0.7rem' }}>
                    <span style={{ color: color }}>{selection?.path?.[0]}</span>
                    {'-'}
                    <span>{selection?.path?.[1]}</span>
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleVisibilityToggle(selection.path)}
                    style={{ padding: 4 }}
                  >
                    {isSelectionVisible(selection.path) ? (
                      <VisibilityOutlined style={{ fontSize: 16, color: '#ffffff' }} />
                    ) : (
                      <VisibilityOffOutlined style={{ fontSize: 16, color: '#666666' }} />
                    )}
                  </IconButton>
                </div>
                {featureData?.feat_imp && (
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', height: PLOT_HEIGHT }}>
                    <div style={{ width: '80px', height: '100%', padding: 0, margin: 0, lineHeight: 0 }}>
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
                    <div
                      ref={heatmapContainerRef}
                      style={{ flex: 1, overflow: 'hidden' }}
                    >
                      <FeatureHeatmap
                        featureData={featureData}
                        height={PLOT_HEIGHT}
                        width={heatmapContainerWidth}
                      />
                    </div>
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
  console.log('todo, cellSets', cellSets);


  const [{ image }, _] = useImageData(
    loaders,
    dataset,
    false,
    { setSpatialImageLayer },
    { spatialImageLayer },
    {} // TODO: which values to match on
  );
  // console.log('todo, loaders', imageStatus, image);

  const [displayedChannels, setDisplayedChannels] = useState([]);
  const [channelNames, setChannelNames] = useState([]);
  const { loaders: imageLayerLoaders, meta: imageLayerMeta } = image || {};
  useEffect(() => {
    if (!imageLayerLoaders) return;
    // console.log('todo, imageLayerLoaders', imageLayerLoaders);
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