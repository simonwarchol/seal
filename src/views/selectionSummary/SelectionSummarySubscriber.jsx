import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useCoordination, useLoaders, useImageData, useObsSetsData, useAuxiliaryCoordination, useObsLocationsData, useObsSegmentationsData, useReady, useClosestVitessceContainerSize, useWindowDimensions, useComponentLayout } from '@vitessce/vit-s';
import { COMPONENT_COORDINATION_TYPES, ViewType, CoordinationType as ct } from '@vitessce/constants-internal';
import { capitalize } from '@vitessce/utils';
import { mergeObsSets } from '@vitessce/sets-utils';
import { Typography } from '@material-ui/core';
import IconButton from '@mui/material/IconButton';
import { Close as CloseIcon } from '@mui/icons-material';
import { LayerControllerMemoized } from '../controller/LayerControllerSubscriber';
import { DEFAULT_RASTER_LAYER_PROPS } from "@vitessce/spatial-utils";
import SelectionSummary from './SelectionSummary';
import useStore from '../../store';

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
      <SelectionSummary
        selections={obsSetSelection}
        cellSets={mergedCellSets}
        setCellSetSelection={setObsSetSelection}
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

