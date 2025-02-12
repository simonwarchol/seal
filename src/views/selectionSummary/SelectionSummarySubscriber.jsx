import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useCoordination, TitleInfo, useLoaders, useImageData } from '@vitessce/vit-s';
import { COMPONENT_COORDINATION_TYPES, ViewType, CoordinationType as ct } from '@vitessce/constants-internal';
import { capitalize } from '@vitessce/utils';
import { Card, CardContent, Typography } from '@material-ui/core';
import useStore from "../../store";
import ScatterPlot from './ScatterPlot';
import FeatureHeatmap from './FeatureHeatmap';

import StickyHeader from './StickyHeader';
import * as d3 from 'd3';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';



function SelectionsDisplay({ selections, displayedChannels, channelNames }) {
  const setFeatures = useStore((state) => state.setFeatures);
  const [viewMode, setViewMode] = useState('embedding');
  const headerRef = useRef();
  const [heatmapContainerWidth, setHeatmapContainerWidth] = useState(0);
  const heatmapContainerRef = useRef();
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const loaders = useLoaders();


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
    if (!selections?.length || !setFeatures) {
      setRectWidth(0);
      return;
    }
    const featureData = setFeatures[selections[0][0]]?.[selections[0][1]];
    if (!featureData?.feat_imp?.length) {
      setRectWidth(0);
      return;
    }
    setRectWidth(heatmapContainerWidth / featureData.feat_imp.length);
  }, [selections, setFeatures, heatmapContainerWidth]);

  useEffect(() => {
    if (!headerRef.current || !selections?.length) return;

    // Create SVG container if it doesn't exist
    let svg = d3.select(headerRef.current).select('svg');
    if (svg.empty()) {
      svg = d3.select(headerRef.current)
        .append('svg')
        .attr('width', heatmapContainerWidth)
        .attr('height', '60px');
    } else {
      svg.attr('width', heatmapContainerWidth);
    }

    // Get feature data
    const featureData = setFeatures[selections[0][0]]?.[selections[0][1]];
    if (!featureData?.feat_imp) return;

    // Update or create labels
    const labels = svg.selectAll('text')
      .data(featureData.feat_imp);

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
      .attr('fill', '#ffffff')
      .style('font-size', '0.6rem')
      .style('cursor', 'pointer')
      .text(d => d[0])
  }, [selections, setFeatures, rectWidth, heatmapContainerWidth]);

  // Sort the selections array before mapping
  const sortedSelections = useMemo(() => {
    if (!sortBy || !selections) return selections;

    return [...selections].sort((a, b) => {
      const aData = setFeatures[a[0]]?.[a[1]]?.feat_imp;
      const bData = setFeatures[b[0]]?.[b[1]]?.feat_imp;

      if (!aData || !bData) return 0;

      const aValue = aData.find(d => d[0] === sortBy)?.[1] || 0;
      const bValue = bData.find(d => d[0] === sortBy)?.[1] || 0;

      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [selections, setFeatures, sortBy, sortDirection]);

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
        const featureData = setFeatures[selection[0]]?.[selection[1]];
        const PLOT_HEIGHT = 80;
        return (
          <Card key={i} variant="outlined" style={{ backgroundColor: '#1E1E1E', borderColor: '#333333', padding: 1 }}>
            <CardContent style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '5px' }}>
                <Typography variant="subtitle2" style={{ color: '#ffffff', fontSize: '0.7rem' }}>
                  {selection.join('-')}
                </Typography>
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

  const [{ obsType, obsSetSelection, spatialImageLayer, dataset }, { setSpatialImageLayer }] = useCoordination(
    [
      ...COMPONENT_COORDINATION_TYPES[ViewType.OBS_SETS],
      ...COMPONENT_COORDINATION_TYPES[ViewType.SPATIAL],
      ct.SPATIAL_IMAGE_LAYER
    ],
    coordinationScopes
  );

  const [{ image }, imageStatus] = useImageData(
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
      <SelectionsDisplay selections={obsSetSelection} displayedChannels={displayedChannels} channelNames={channelNames} />
    </TitleInfo>
  );
}

export default SelectionsDisplay;