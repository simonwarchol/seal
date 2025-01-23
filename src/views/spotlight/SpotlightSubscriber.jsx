import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
  forwardRef,
  PureComponent,
} from "react";
import { Icon } from '@material-ui/core';
import { debounce, find, isEqual, merge } from "lodash-es";
import {
  TitleInfo,
  useDeckCanvasSize,
  useReady,
  useUrls,
  useObsLocationsData,
  useObsSegmentationsData,
  useObsSetsData,
  useFeatureSelection,
  useImageData,
  useObsFeatureMatrixIndices,
  useFeatureLabelsData,
  useNeighborhoodsData,
  useObsLabelsData,
  useMultiObsLabels,
  useUint8FeatureSelection,
  useExpressionValueGetter,
  useGetObsInfo,
  useInitialCoordination,
  useCoordination,
  useLoaders,
  useSetComponentHover,
  useSetComponentViewInfo,
  useAuxiliaryCoordination,
  useHasLoader,
  useComponentHover,
  useComponentViewInfo,
  usePlotOptionsStyles,
  OptionsContainer,
  CellColorEncodingOption,
  OptionSelect,
} from "@vitessce/vit-s";
import {
  setObsSelection,
  mergeObsSets,
  colorArrayToString,
  getCellColors,
  treeFindNodeByNamePath
} from "@vitessce/sets-utils";
import {
  canLoadResolution,
  getSourceFromLoader,
  isInterleaved,
} from "@vitessce/spatial-utils";
import { Legend } from "@vitessce/legend";
import {
  COMPONENT_COORDINATION_TYPES,
  ViewType,
  DataType,
  STATUS,
} from "@vitessce/constants-internal";
import {
  Typography,
  Checkbox,
  TableCell,
  TableRow,
  Slider,
  makeStyles,
} from "@material-ui/core";
import {
  deck,
  viv,
  getSelectionLayer,
  ScaledExpressionExtension,
  GLSL_COLORMAPS,
  DEFAULT_GL_OPTIONS,
  SELECTION_TYPE,
} from "@vitessce/gl";
import { Matrix4 } from "math.gl";
import {
  PALETTE,
  getDefaultColor,
  pluralize as plur,
  commaNumber,
} from "@vitessce/utils";
import { createQuadTree } from "@vitessce/scatterplot";
import shortNumber from "short-number";
import { DEFAULT_LAYER_TYPE_ORDERING } from "@vitessce/spatial-utils";
import { extent } from "d3-array";
import { Tooltip2D, TooltipContent } from "@vitessce/tooltip";
import { useId } from "react-aria";
import clsx from "clsx";
import { PointerIconSVG, SelectLassoIconSVG } from "@vitessce/icons";
import { CenterFocusStrong, ErrorSharp } from "@material-ui/icons";
import { SpotlightBitmaskLayer } from "./SpotlightBitmaskLayer";
import useStore from "../../store";
import housePointer from "../../public/housePointer.svg";

const getCursorWithTool = () => "crosshair";
const getCursor = (interactionState) =>
  interactionState.isDragging ? "grabbing" : "default";

function getOnHoverCallback(obsIndex, setObsHighlight, setComponentHover) {
  return (info) => {
    // Notify the parent component that its child component is
    // the "hover source".
    if (setComponentHover) {
      setComponentHover();
    }
    if (info.index) {
      const obsId = obsIndex[info.index];
      if (setObsHighlight) {
        setObsHighlight(obsId);
      }
    } else if (setObsHighlight) {
      // Clear the currently-hovered cell info by passing null.
      setObsHighlight(null);
    }
  };
}

const useStyles = makeStyles(() => ({
  toolButton: {
    display: "inline-flex",
    "&:active": {
      opacity: ".65",
      extend: "iconClicked",
    },
  },
  tool: {
    position: "absolute",
    display: "inline",
    zIndex: "1000",
    opacity: ".65",
    color: "black",
    "&:hover": {
      opacity: ".90",
    },
  },
  iconClicked: {
    // Styles for the clicked state
    boxShadow: "none",
    transform: "scale(0.98)", // make the button slightly smaller
  },
  toolIcon: {
    // btn btn-outline-secondary mr-2 icon
    padding: "0",
    height: "2em",
    width: "2em",
    backgroundColor: "white",

    display: "inline-block",
    fontWeight: "400",
    textAlign: "center",
    verticalAlign: "middle",
    cursor: "pointer",
    userSelect: "none",
    border: "1px solid #6c757d",
    fontSize: "16px",
    lineHeight: "1.5",
    borderRadius: "4px",
    transition:
      "color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
    color: "#6c757d",

    marginRight: "8px",

    "& > svg": {
      verticalAlign: "middle",
      color: "black",
    },
    "&:active": {
      extend: "iconClicked",
    },
  },
  toolActive: {
    // active
    color: "#fff",
    backgroundColor: "#6c757d",
    borderColor: "#6c757d",
    boxShadow: "0 0 0 3px rgba(108, 117, 125, 0.5)",
  },
}));

function IconTool(props) {
  const { alt, onClick, isActive, children } = props;
  const classes = useStyles();
  return (
    <button
      className={clsx(classes.toolIcon, { [classes.toolActive]: isActive })}
      onClick={onClick}
      type="button"
      title={alt}
    >
      {children}
    </button>
  );
}

function IconButton(props) {
  const { alt, onClick, children } = props;
  const classes = useStyles();
  return (
    <button
      className={clsx(classes.toolIcon, classes.toolButton)}
      onClick={onClick}
      type="button"
      title={alt}
    >
      {children}
    </button>
  );
}

function ToolMenu(props) {
  const {
    setActiveTool,
    activeTool,
    visibleTools = { pan: true, selectLasso: true },
    recenterOnClick = () => { },
  } = props;


  const classes = useStyles();

  const onRecenterButtonCLick = () => {
    recenterOnClick();
  };

  return (
    <div className={classes.tool}>
      {visibleTools.pan && (
        <IconTool
          alt="pointer tool"
          onClick={() => {
            setActiveTool(null)
          }}
          isActive={activeTool === null}
        >
          <PointerIconSVG />
        </IconTool>
      )}
      {visibleTools.selectLasso ? (
        <IconTool
          alt="select lasso"
          onClick={() => {
            setActiveTool(SELECTION_TYPE.POLYGON)
          }}
          isActive={activeTool === SELECTION_TYPE.POLYGON}
        >
          <SelectLassoIconSVG />
        </IconTool>
      ) : null}
      <IconButton
        alt="click to recenter"
        onClick={() => onRecenterButtonCLick()}
        aria-label="Recenter scatterplot view"
      >
        <CenterFocusStrong />
      </IconButton>
      <IconTool
        alt="neighborhood pointer"
        onClick={() => {
          setActiveTool('NEIGHBORHOOD_POINTER')
        }}
        isActive={activeTool === 'NEIGHBORHOOD_POINTER'}
      >
        <Icon style={{ textAlign: 'center' }}>
          <img style={{ height: 24, width: 24 }} src={housePointer} />
        </Icon>
      </IconTool>
    </div>
  );
}

export default class AbstractSpatialOrScatterplot extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      gl: null,
      tool: null,
    };

    this.viewport = null;
    this.onViewStateChange = this.onViewStateChange.bind(this);
    this.onInitializeViewInfo = this.onInitializeViewInfo.bind(this);
    this.onWebGLInitialized = this.onWebGLInitialized.bind(this);
    this.onToolChange = this.onToolChange.bind(this);
    this.onHover = this.onHover.bind(this);
    this.recenter = this.recenter.bind(this);
  }

  /**
   * Called by DeckGL upon a viewState change,
   * for example zoom or pan interaction.
   * Emit the new viewState to the `setViewState`
   * handler prop.
   * @param {object} params
   * @param {object} params.viewState The next deck.gl viewState.
   */
  onViewStateChange({ viewState: nextViewState }) {
    const { setViewState, viewState, spatialAxisFixed } = this.props;
    const use3d = this.use3d();
    setViewState({
      ...nextViewState,
      // If the axis is fixed, just use the current target in state i.e don't change target.
      target:
        spatialAxisFixed && use3d ? viewState.target : nextViewState.target,
    });
  }

  /**
   * Called by DeckGL upon viewport
   * initialization.
   * @param {object} viewState
   * @param {object} viewState.viewport
   */
  onInitializeViewInfo({ viewport }) {
    this.viewport = viewport;
  }

  /**
   * Called by DeckGL upon initialization,
   * helps to understand when to pass layers
   * to the DeckGL component.
   * @param {object} gl The WebGL context object.
   */
  onWebGLInitialized(gl) {
    this.setState({ gl });
  }



  /**
   * Called by the ToolMenu buttons.
   * Emits the new tool value to the
   * `onToolChange` prop.
   * @param {string} tool Name of tool.
   */
  onToolChange(tool) {
    const { onToolChange: onToolChangeProp } = this.props;
    this.setState({ tool });
    if (onToolChangeProp) {
      onToolChangeProp(tool);
    }
  }

  /**
   * Create the DeckGL layers.
   * @returns {object[]} Array of
   * DeckGL layer objects.
   * Intended to be overriden by descendants.
   */
  // eslint-disable-next-line class-methods-use-this
  getLayers() {
    return [];
  }

  // TODO: remove this method and use the layer-level onHover instead.
  // (e.g., see delegateHover in spatial-beta/SpatialSubscriber.js).
  // eslint-disable-next-line consistent-return
  onHover(info) {
    const { coordinate, sourceLayer: layer, tile } = info;
    const {
      setCellHighlight,
      cellHighlight,
      setComponentHover,
      layers,
      setHoverInfo,
    } = this.props;
    const hasBitmask = (layers || []).some((l) => l.type === "bitmask");
    if (!setCellHighlight || !tile) {
      return null;
    }
    if (!layer || !coordinate) {
      if (cellHighlight && hasBitmask) {
        setCellHighlight(null);
      }
      if (setHoverInfo) {
        setHoverInfo(null, null);
      }
      return null;
    }
    const {
      content,
      bbox,
      index: { z },
    } = tile;
    if (!content) {
      if (cellHighlight && hasBitmask) {
        setCellHighlight(null);
      }
      if (setHoverInfo) {
        setHoverInfo(null, null);
      }
      return null;
    }
    const { data, width, height } = content;
    const { left, right, top, bottom } = bbox;
    const bounds = [
      left,
      data.height < layer.tileSize ? height : bottom,
      data.width < layer.tileSize ? width : right,
      top,
    ];
    if (!data) {
      if (cellHighlight && hasBitmask) {
        setCellHighlight(null);
      }
      return null;
    }
    // Tiled layer needs a custom layerZoomScale.
    if (layer.id.includes("bitmask")) {
      // The zoomed out layer needs to use the fixed zoom at which it is rendered.
      const layerZoomScale = Math.max(1, 2 ** Math.round(-z));
      const dataCoords = [
        Math.floor((coordinate[0] - bounds[0]) / layerZoomScale),
        Math.floor((coordinate[1] - bounds[3]) / layerZoomScale),
      ];
      const coords = dataCoords[1] * width + dataCoords[0];
      const hoverData = data.map((d) => d[coords]);
      const cellId = hoverData.find((i) => i > 0);
      if (cellId !== Number(cellHighlight)) {
        if (setComponentHover) {
          setComponentHover();
        }
        // eslint-disable-next-line no-unused-expressions
        setCellHighlight(cellId ? String(cellId) : null);
      }
      if (setHoverInfo) {
        if (cellId) {
          setHoverInfo(hoverData, coordinate);
        } else {
          setHoverInfo(null, null);
        }
      }
    }
  }

  /**
   * Emits a function to project from the
   * cell ID space to the scatterplot or
   * spatial coordinate space, via the
   * `updateViewInfo` prop.
   */
  viewInfoDidUpdate(obsIndex, obsLocations, makeGetObsCoords) {
    const { updateViewInfo, uuid } = this.props;
    const { viewport } = this;
    if (updateViewInfo && viewport) {
      updateViewInfo({
        uuid,
        project: viewport.project,
        projectFromId: (obsId) => {
          try {
            if (obsIndex && obsLocations) {
              const getObsCoords = makeGetObsCoords(obsLocations);
              const obsIdx = obsIndex.indexOf(obsId);
              const obsCoord = getObsCoords(obsIdx);
              return viewport.project(obsCoord);
            }
            return [null, null];
          } catch (e) {
            return [null, null];
          }
        },
      });
    }
  }

  /**
   * Intended to be overridden by descendants.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  componentDidUpdate() { }

  /** Intended to be overridden by descendants.
   * Resets the view type to its original position.
   */
  // eslint-disable-next-line class-methods-use-this
  recenter() { }


  /**
   * Intended to be overridden by descendants.
   * @returns {boolean} Whether or not any layers are 3D.
   */
  // eslint-disable-next-line class-methods-use-this
  use3d() {
    return false;
  }

  /**
   * A common render function for both Spatial
   * and Scatterplot components.
   */
  render() {
    const { deckRef, viewState, uuid, hideTools, orbitAxis } = this.props;
    const { gl, tool } = this.state;
    const layers = this.getLayers();
    const use3d = this.use3d();

    const showCellSelectionTools = this.obsSegmentationsData !== null;
    const showPanTool = layers.length > 0;
    // For large datasets or ray casting, the visual quality takes only a small
    // hit in exchange for much better performance by setting this to false:
    // https://deck.gl/docs/api-reference/core/deck#usedevicepixels
    const useDevicePixels =
      !use3d &&
      (this.obsSegmentationsData?.shape?.[0] < 100000 ||
        this.obsLocationsData?.shape?.[1] < 100000);



    return (
      <>
        <ToolMenu
          activeTool={tool}
          setActiveTool={this.onToolChange}
          visibleTools={{
            pan: showPanTool && !hideTools,
            selectLasso: showCellSelectionTools && !hideTools,
          }}
          recenterOnClick={this.recenter}
        />
        <deck.DeckGL
          id={`deckgl-overlay-${uuid}`}
          ref={deckRef}
          views={[
            use3d
              ? new deck.OrbitView({ id: "orbit", controller: true, orbitAxis })
              : new deck.OrthographicView({
                id: "ortho",
              }),
          ]} // id is a fix for https://github.com/uber/deck.gl/issues/3259
          layers={
            gl &&
              viewState.target.slice(0, 2).every((i) => typeof i === "number")
              ? layers
              : []
          }
          glOptions={DEFAULT_GL_OPTIONS}
          onWebGLInitialized={this.onWebGLInitialized}
          onViewStateChange={this.onViewStateChange}
          viewState={viewState}
          useDevicePixels={useDevicePixels}
          controller={tool ? { dragPan: false } : true}
          getCursor={tool ? getCursorWithTool : getCursor}
          onHover={this.onHover}
        >
          {this.onInitializeViewInfo}
        </deck.DeckGL>
      </>
    );
  }
}

const useToggleStyles = makeStyles(() => ({
  cameraLabel: {
    padding: "0px 0px 0px 16px",
  },
  toggleBox: {
    padding: "0px",
  },
}));

const ToggleFixedAxisButton = ({
  setSpatialAxisFixed,
  spatialAxisFixed,
  use3d,
}) => {
  const toggleAxisId = useId();
  const classes = useToggleStyles();
  return (
    <TableRow>
      <TableCell className={classes.cameraLabel} variant="head" scope="row">
        <label htmlFor={`spatial-camera-axis-${toggleAxisId}`}>
          Fix Camera Axis
        </label>
      </TableCell>
      <TableCell className={classes.toggleBox} variant="body">
        <Checkbox
          onClick={() => setSpatialAxisFixed(!spatialAxisFixed)}
          disabled={!use3d}
          checked={Boolean(spatialAxisFixed)}
          inputProps={{
            "aria-label": "Fix or not fix spatial camera axis",
            id: `spatial-camera-axis-${toggleAxisId}`,
          }}
        />
      </TableCell>
    </TableRow>
  );
};

function SpatialOptions(props) {
  const {
    observationsLabel,
    cellColorEncoding,
    setCellColorEncoding,
    setSpatialAxisFixed,
    spatialAxisFixed,
    use3d,
    tooltipsVisible,
    setTooltipsVisible,
    geneExpressionColormap,
    setGeneExpressionColormap,
    geneExpressionColormapRange,
    setGeneExpressionColormapRange,
    canShowExpressionOptions,
    canShowColorEncodingOption,
    canShow3DOptions,
  } = props;

  const spatialOptionsId = useId();

  function handleGeneExpressionColormapChange(event) {
    setGeneExpressionColormap(event.target.value);
  }

  function handleColormapRangeChange(event, value) {
    setGeneExpressionColormapRange(value);
  }
  const handleColormapRangeChangeDebounced = useCallback(
    debounce(handleColormapRangeChange, 5, { trailing: true }),
    [handleColormapRangeChange]
  );

  useEffect(() => {
    setTooltipsVisible(false);
  }, [tooltipsVisible]);

  function handleTooltipsVisibilityChange(event) {
    setTooltipsVisible(event.target.checked);
  }

  const classes = usePlotOptionsStyles();

  return (
    <OptionsContainer>
      {canShowColorEncodingOption ? (
        <CellColorEncodingOption
          observationsLabel={observationsLabel}
          cellColorEncoding={cellColorEncoding}
          setCellColorEncoding={setCellColorEncoding}
        />
      ) : null}
      {canShow3DOptions ? (
        <ToggleFixedAxisButton
          setSpatialAxisFixed={setSpatialAxisFixed}
          spatialAxisFixed={spatialAxisFixed}
          use3d={use3d}
        />
      ) : null}
      <TableRow>
        <TableCell className={classes.labelCell} variant="head" scope="row">
          <label
            htmlFor={`gene-expression-colormap-option-tooltip-visibility-${spatialOptionsId}`}
          >
            Tooltips Visible
          </label>
        </TableCell>
        <TableCell className={classes.inputCell} variant="body">
          <Checkbox
            className={classes.checkbox}
            /**
             * We have to use "checked" here, not "value".
             * The checkbox state is not persisting with value.
             * For reference, https://v4.mui.com/api/checkbox/
             */
            checked={tooltipsVisible}
            onChange={handleTooltipsVisibilityChange}
            name="gene-expression-colormap-option-tooltip-visibility"
            color="default"
            inputProps={{
              "aria-label": "Enable or disable tooltips",
              id: `gene-expression-colormap-option-tooltip-visibility-${spatialOptionsId}`,
            }}
          />
        </TableCell>
      </TableRow>
      {canShowExpressionOptions ? (
        <>
          <TableRow>
            <TableCell className={classes.labelCell} variant="head" scope="row">
              <label
                htmlFor={`gene-expression-colormap-select-${spatialOptionsId}`}
              >
                Gene Expression Colormap
              </label>
            </TableCell>
            <TableCell className={classes.inputCell} variant="body">
              <OptionSelect
                key="gene-expression-colormap-select"
                className={classes.select}
                value={geneExpressionColormap}
                onChange={handleGeneExpressionColormapChange}
                inputProps={{
                  id: `gene-expression-colormap-select-${spatialOptionsId}`,
                }}
              >
                {GLSL_COLORMAPS.map((cmap) => (
                  <option key={cmap} value={cmap}>
                    {cmap}
                  </option>
                ))}
              </OptionSelect>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.labelCell} variant="head" scope="row">
              <label
                htmlFor={`gene-expression-colormap-range-${spatialOptionsId}`}
              >
                Gene Expression Colormap Range
              </label>
            </TableCell>
            <TableCell className={classes.inputCell} variant="body">
              <Slider
                classes={{
                  root: classes.slider,
                  valueLabel: classes.sliderValueLabel,
                }}
                value={geneExpressionColormapRange}
                onChange={handleColormapRangeChangeDebounced}
                getAriaLabel={(index) => {
                  const labelPrefix =
                    index === 0 ? "Low value slider" : "High value slider";
                  return `${labelPrefix} for spatial gene expression colormap range`;
                }}
                id={`gene-expression-colormap-range-${spatialOptionsId}`}
                valueLabelDisplay="auto"
                step={0.005}
                min={0.0}
                max={1.0}
              />
            </TableCell>
          </TableRow>
        </>
      ) : null}
    </OptionsContainer>
  );
}

function SpatialTooltipSubscriber(props) {
  const {
    parentUuid,
    obsHighlight,
    width,
    height,
    getObsInfo,
    hoverData,
    hoverCoord,
    useHoverInfoForTooltip,
    getObsIdFromHoverData,
  } = props;

  const sourceUuid = useComponentHover();
  const viewInfo = useComponentViewInfo(parentUuid);

  let [cellInfo, x, y] = [null, null, null];
  if (
    useHoverInfoForTooltip &&
    getObsIdFromHoverData &&
    hoverData &&
    hoverCoord &&
    parentUuid === sourceUuid
  ) {
    // No observation centroid coordinates were provided, so use
    // the mouse hover info to position the tooltip.
    const obsId = getObsIdFromHoverData(hoverData);
    if (obsId) {
      [cellInfo, x, y] = [
        getObsInfo(obsId),
        ...(viewInfo && viewInfo.project
          ? viewInfo.project(hoverCoord)
          : [null, null]),
      ];
    }
  } else if (!useHoverInfoForTooltip && getObsInfo && obsHighlight) {
    // Observation centroid coordinates were provided, so use
    // those coordinates to position the tooltip.
    const obsId = obsHighlight;
    [cellInfo, x, y] = [
      getObsInfo(obsId),
      ...(viewInfo && viewInfo.projectFromId
        ? viewInfo.projectFromId(obsId)
        : [null, null]),
    ];
  }

  return cellInfo ? (
    <Tooltip2D
      x={x}
      y={y}
      parentUuid={parentUuid}
      sourceUuid={sourceUuid}
      parentWidth={width}
      parentHeight={height}
    >
      <TooltipContent info={cellInfo} />
    </Tooltip2D>
  ) : null;
}

/**
 * Sort spatial layer definition array,
 * to keep the ordering in the layer controller
 * consistent.
 * Intended to be used with auto-initialized layer
 * definition arrays only, as a pre-defined layer array
 * should not be re-ordered.
 * @param {object[]} layers Array of layer definition objects.
 * Object must have a .type property.
 */
function sortLayers(layers) {
  return layers.sort(
    (a, b) =>
      DEFAULT_LAYER_TYPE_ORDERING.indexOf(a.type) -
      DEFAULT_LAYER_TYPE_ORDERING.indexOf(b.type)
  );
}

/**
 * Make a subtitle for the spatial component.
 * @param {object} params
 * @param {number} params.observationsCount
 * @param {string} params.observationsLabel
 * @param {string} params.observationsPluralLabel
 * @param {number} params.subobservationsCount
 * @param {string} params.subobservationsLabel
 * @param {string} params.subobservationsPluralLabel
 * @param {number} params.locationsCount
 * @returns {string} The subtitle string,
 * with info about items with zero counts omitted.
 */
function makeSpatialSubtitle({
  observationsCount,
  observationsLabel,
  subobservationsCount,
  subobservationsLabel,
  locationsCount,
}) {
  const parts = [];
  if (subobservationsCount > 0) {
    let part = `${commaNumber(subobservationsCount)} ${plur(
      subobservationsLabel,
      subobservationsCount
    )}`;
    if (locationsCount > 0) {
      part += ` at ${shortNumber(locationsCount)} locations`;
    }
    parts.push(part);
  }
  if (observationsCount > 0) {
    parts.push(
      `${commaNumber(observationsCount)} ${plur(
        observationsLabel,
        observationsCount
      )}`
    );
  }
  return parts.join(", ");
}

function getInitialSpatialTargets({
  width,
  height,
  obsCentroids,
  obsSegmentations,
  obsSegmentationsType,
  imageLayerLoaders,
  useRaster,
  use3d,
  modelMatrices,
}) {
  let initialTargetX = -Infinity;
  let initialTargetY = -Infinity;
  let initialTargetZ = -Infinity;
  let initialZoom = -Infinity;
  // Some backoff from completely filling the screen.
  const zoomBackoff = use3d ? 1.5 : 0.1;
  if (imageLayerLoaders.length > 0 && useRaster) {
    for (let i = 0; i < imageLayerLoaders.length; i += 1) {
      const viewSize = { height, width };
      const { target, zoom: newViewStateZoom } = viv.getDefaultInitialViewState(
        imageLayerLoaders[i].data,
        viewSize,
        zoomBackoff,
        use3d,
        new Matrix4(modelMatrices[i])
      );
      if (target[0] > initialTargetX) {
        // eslint-disable-next-line prefer-destructuring
        initialTargetX = target[0];
        initialZoom = newViewStateZoom;
      }
      if (target[1] > initialTargetY) {
        // eslint-disable-next-line prefer-destructuring
        initialTargetY = target[1];
        initialZoom = newViewStateZoom;
      }
      if (target[2] > initialTargetZ) {
        // eslint-disable-next-line prefer-destructuring
        initialTargetZ = target[2];
        initialZoom = newViewStateZoom;
      } else {
        initialTargetZ = null;
      }
    }
  } else if (
    !useRaster &&
    ((obsSegmentationsType === "polygon" && obsSegmentations) ||
      (!obsSegmentations && obsCentroids)) // For backwards compatibility (diamond case).
  ) {
    let xExtent;
    let yExtent;
    let xRange;
    let yRange;
    if (obsCentroids) {
      xExtent = extent(obsCentroids.data[0]);
      yExtent = extent(obsCentroids.data[1]);
      xRange = xExtent[1] - xExtent[0];
      yRange = yExtent[1] - yExtent[0];
    }
    if (!obsCentroids || xRange === 0) {
      // The fall back is the cells' polygon coordinates, if the original range
      // is 0 i.e the centroids are all on the same axis.
      xExtent = extent(obsSegmentations.data, (poly) => poly[0][0]);
      xRange = xExtent[1] - xExtent[0];
    }
    if (!obsCentroids || yRange === 0) {
      // The fall back is the first cells' polygon coordinates, if the original range
      // is 0 i.e the centroids are all on the same axis.
      yExtent = extent(obsSegmentations.data, (poly) => poly[0][1]);
      yRange = yExtent[1] - yExtent[0];
    }
    initialTargetX = xExtent[0] + xRange / 2;
    initialTargetY = yExtent[0] + yRange / 2;
    initialTargetZ = null;
    initialZoom =
      Math.log2(Math.min(width / xRange, height / yRange)) - zoomBackoff;
  } else {
    return {
      initialTargetX: null,
      initialTargetY: null,
      initialTargetZ: null,
      initialZoom: null,
    };
  }
  return {
    initialTargetX,
    initialTargetY,
    initialZoom,
    initialTargetZ,
  };
}

/**
 * Make a subtitle for the spatial component.
 * @param {object} data PixelSource | PixelSource[]
 * @returns {Array} [Layer, PixelSource | PixelSource[]] tuple.
 */
function getLayerLoaderTuple(data, use3d) {
  const loader =
    (Array.isArray(data) && data.length > 1) || !Array.isArray(data)
      ? data
      : data[0];
  if (use3d) {
    return [viv.VolumeLayer, Array.isArray(loader) ? loader : [loader]];
  }
  // todo update this to use the new layer

  const Layer =
    Array.isArray(data) && data.length > 1
      ? viv.MultiscaleImageLayer
      : viv.ImageLayer;
  return [Layer, loader];
}

function renderSubBitmaskLayers(props) {
  const {
    bbox: { left, top, right, bottom },
    index: { x, y, z },
  } = props.tile;
  const { data, id, loader } = props;
  // Only render in positive coorinate system
  if ([left, bottom, right, top].some((v) => v < 0) || !data) {
    return null;
  }
  const base = loader[0];
  const [height, width] = loader[0].shape.slice(-2);
  // Tiles are exactly fitted to have height and width such that their bounds
  // match that of the actual image (not some padded version).
  // Thus the right/bottom given by deck.gl are incorrect since
  // they assume tiles are of uniform sizes, which is not the case for us.
  const bounds = [
    left,
    data.height < base.tileSize ? height : bottom,
    data.width < base.tileSize ? width : right,
    top,
  ];
  return new SpotlightBitmaskLayer({ ...props }, {
    channelData: data,
    // Uncomment to help debugging - shades the tile being hovered over.
    // autoHighlight: true,
    // highlightColor: [80, 80, 80, 50],
    // Shared props with BitmapLayer:
    bounds,
    id: `sub-layer-${bounds}-${id}`,
    tileId: { x, y, z },
  });
}

const CELLS_LAYER_ID = "cells-layer";
const TITLES_LAYER_ID = "titles-layer";
const MOLECULES_LAYER_ID = "molecules-layer";
const NEIGHBORHOODS_LAYER_ID = "neighborhoods-layer";

// Default getter function props.
const makeDefaultGetCellColors =
  (cellColors, obsIndex, theme) =>
    (object, { index }) => {
      const [r, g, b, a] =
        (cellColors && obsIndex && cellColors.get(obsIndex[index])) ||
        getDefaultColor(theme);
      return [r, g, b, 255 * (a || 1)];
    };
const makeDefaultGetCellIsSelected = (cellSelection) => {
  if (cellSelection) {
    // For performance, convert the Array to a Set instance.
    // Set.has() is faster than Array.includes().
    const cellSelectionSet = new Set(cellSelection);
    return (cellEntry) => (cellSelectionSet.has(cellEntry[0]) ? 1.0 : 0.0);
  }
  return () => 0.0;
};
const makeDefaultGetObsCoords = (obsLocations) => (i) =>
  [obsLocations.data[0][i], obsLocations.data[1][i], 0];

function getVivLayerExtensions(use3d, colormap, renderingMode) {
  if (use3d) {
    // Is 3d
    if (colormap) {
      // Colormap: use AdditiveColormap extensions
      if (renderingMode === "Minimum Intensity Projection") {
        return [
          new viv.AdditiveColormap3DExtensions.MinimumIntensityProjectionExtension(),
        ];
      }
      if (renderingMode === "Maximum Intensity Projection") {
        return [
          new viv.AdditiveColormap3DExtensions.MaximumIntensityProjectionExtension(),
        ];
      }
      return [new viv.AdditiveColormap3DExtensions.AdditiveBlendExtension()];
    }
    // No colormap: use ColorPalette extensions
    if (renderingMode === "Minimum Intensity Projection") {
      return [
        new viv.ColorPalette3DExtensions.MinimumIntensityProjectionExtension(),
      ];
    }
    if (renderingMode === "Maximum Intensity Projection") {
      return [
        new viv.ColorPalette3DExtensions.MaximumIntensityProjectionExtension(),
      ];
    }
    return [new viv.ColorPalette3DExtensions.AdditiveBlendExtension()];
  }
  // Not 3d
  if (colormap) {
    return [new viv.AdditiveColormapExtension()];
  }
  return [new viv.ColorPaletteExtension()];
}

/**
 * React component which expresses the spatial relationships between cells and molecules.
 * @param {object} props
 * @param {string} props.uuid A unique identifier for this component,
 * used to determine when to show tooltips vs. crosshairs.
 * @param {number} props.height Height of the DeckGL canvas, used when
 * rendering the scale bar layer.
 * @param {number} props.width Width of the DeckGL canvas, used when
 * rendering the scale bar layer.
 * @param {object} props.viewState The DeckGL viewState object.
 * @param {function} props.setViewState A handler for updating the DeckGL
 * viewState object.
 * @param {object} props.molecules Molecules data.
 * @param {object} props.cells Cells data.
 * @param {object} props.neighborhoods Neighborhoods data.
 * @param {number} props.lineWidthScale Width of cell border in view space (deck.gl).
 * @param {number} props.lineWidthMaxPixels Max width of the cell border in pixels (deck.gl).
 * @param {object} props.imageLayerLoade  rs An object mapping raster layer index to Viv loader
 * instances.
 * @param {object} props.cellColors Map from cell IDs to colors [r, g, b].
 * @param {function} props.getCellCoords Getter function for cell coordinates
 * (used by the selection layer).
 * @param {function} props.getCellColor Getter function for cell color as [r, g, b] array.
 * @param {function} props.getCellPolygon Getter function for cell polygons.
 * @param {function} props.getCellIsSelected Getter function for cell layer isSelected.
 * @param {function} props.getMoleculeColor
 * @param {function} props.getMoleculePosition
 * @param {function} props.getNeighborhoodPolygon
 * @param {function} props.updateViewInfo Handler for DeckGL viewport updates,
 * used when rendering tooltips and crosshairs.
 * @param {function} props.onCellClick Getter function for cell layer onClick.
 * @param {string} props.theme "light" or "dark" for the vitessce theme
 */
class Spatial extends AbstractSpatialOrScatterplot {
  constructor(props) {
    super(props);
    // To avoid storing large arrays/objects
    // in React state, this component
    // uses instance variables.
    // All instance variables used in this class:
    this.obsSegmentationsQuadTree = null;
    this.obsSegmentationsData = null;
    this.obsLocationsData = null;
    this.selectedSelection = props?.selectedSelection;
    this.selectedBackground = props?.selectedBackground;

    this.imageLayers = [];
    this.obsSegmentationsBitmaskLayers = [];
    this.obsSegmentationsPolygonLayer = null;
    this.obsLocationsLayer = null;
    this.neighborhoodsLayer = null;

    this.layerLoaderSelections = {};
    // Better for the bitmask layer when there is no color data to use this.
    // 2048 is best for performance and for stability (4096 texture size is not always supported).
    this.randomColorData = {
      data: new Uint8Array(2048 * 2048 * 3).map((_, j) =>
        j < 4 ? 0 : Math.round(255 * Math.random())
      ),
      // This buffer should be able to hold colors for 2048 x 2048 ~ 4 million cells.
      height: 2048,
      width: 2048,
    };
    this.color = { ...this.randomColorData };
    this.expression = {
      data: new Uint8Array(2048 * 2048),
      // This buffer should be able to hold colors for 2048 x 2048 ~ 4 million cells.
      height: 2048,
      width: 2048,
    };

    // Initialize data and layers.
    this.onUpdateCellsData();
    this.onUpdateCellsLayer();
    this.onUpdateMoleculesData();
    this.onUpdateMoleculesLayer();
    this.onUpdateNeighborhoodsData();
    this.onUpdateNeighborhoodsLayer();
    this.onUpdateImages();
  }

  createPolygonSegmentationsLayer(layerDef, hasExplicitPolygons) {
    // I need cellSetSelection and setFeatures
    // const { stroked, visible, opacity, radius } = layerDef;
    const { obsCentroidsIndex, obsSegmentationsIndex, additionalCellSets, setFeatures,
      cellSetSelection, dataset, rasterLayers, lockedChannels, setRasterLayers, channels,
      hoverClusterOpacities, setHoveredCluster, showClusterOutlines, showClusterTitles,
      selectNeighborhood
    } = this.props;


    const concaveData = (cellSetSelection || []).map((cellSet) => {
      const setFeature = setFeatures?.[cellSet[0]]?.[cellSet[1]] || {};
      if (dataset == 'A') {
        if (!setFeature?.hulls?.embedding?.concave_hull) return;
        return { hull: setFeature?.hulls?.embedding?.concave_hull, density: setFeature?.hulls?.embedding?.density, features: setFeature?.feat_imp, path: cellSet, centroid: setFeature?.hulls?.embedding?.centroid };
      }
      else if (dataset == 'B') {
        if (!setFeature?.hulls?.spatial?.concave_hull) return;
        return { hull: setFeature?.hulls?.spatial?.concave_hull, density: setFeature?.hulls?.spatial?.density, features: setFeature?.feat_imp, path: cellSet, centroid: setFeature?.hulls?.embedding?.centroid };
      }
      return null;
    }).filter(d => d && d.density > 0.001);

    const obsIndex = hasExplicitPolygons
      ? obsSegmentationsIndex
      : obsCentroidsIndex;
    const {
      theme,
      // cellFilter,
      cellSelection,
      setCellHighlight,
      setComponentHover,
      getCellIsSelected = makeDefaultGetCellIsSelected(
        obsIndex?.length === cellSelection?.length ? null : cellSelection
      ),
      cellColors,
      getCellColor = makeDefaultGetCellColors(cellColors, obsIndex, theme),
      onCellClick,
      lineWidthScale = 10,
      lineWidthMaxPixels = 2,
      geneExpressionColormapRange,
      cellColorEncoding,
      getExpressionValue,
      geneExpressionColormap,
    } = this.props;
    const getPolygon = hasExplicitPolygons
      ? (object, { index, data }) => data.src.obsSegmentations.data[index]
      : (object, { index, data }) => {
        const x = data.src.obsCentroids.data[0][index];
        const y = data.src.obsCentroids.data[1][index];
        const r = radius;
        return [
          [x, y + r],
          [x + r, y],
          [x, y - r],
          [x - r, y],
        ];
      };

    return [new deck.PolygonLayer({
      id: CELLS_LAYER_ID,
      data: showClusterOutlines ? (concaveData || []) : [],
      coordinateSystem: deck.COORDINATE_SYSTEM.CARTESIAN,
      pickable: true,
      autoHighlight: true,
      // autoHighlight: true,
      filled: true,
      stroked: true,
      // backgroundColor: [0, 0, 0],
      getPolygon: d => d.hull,
      // isSelected: getCellIsSelected,
      // getPolygon,
      // updateTriggers: {
      //   getLineWidth: [stroked],
      //   isSelected: cellSelection,
      //   getExpressionValue,
      //   getFillColor: [opacity, cellColorEncoding, cellSelection, cellColors],
      //   getLineColor: [cellColorEncoding, cellSelection, cellColors],
      //   getPolygon: [radius],
      // },
      getFillColor: [255, 255, 255, 0],
      highlightColor: [255, 255, 255, 50],
      getLineWidth: 15,
      // getFillColor: (object, { index }) => {
      //   // const color = getCellColor(object, { index });
      //   // color[3] = opacity * 255;
      //   // return color;
      // },
      // getLineColor: (object, { index }) => {
      //   const color = getCellColor(object, { index });
      //   color[3] = 255;
      //   return color;
      // },
      getLineColor: (d) => {
        const pathString = JSON.stringify(d.path)
        const opacity = hoverClusterOpacities?.get(pathString)
        // check if opacity is undefined
        if (opacity === undefined) {
          return [255, 255, 255, 255]
        } else {
          return [255, 255, 255, opacity * 255]
        }
      },
      onClick: async (info, event, d) => {
        if (!this?.state?.tool) {
          const featureImportance = info.object.features;
          let changeI = 0;
          
          if (rasterLayers?.[0]?.channels?.length > 0) {
            const newRasterLayers = rasterLayers.map(layer => ({
              ...layer,
              channels: layer.channels.map((channel, i) => {
                const c = channels.indexOf(featureImportance?.[changeI]?.[0]);
                if (c === -1) {
                  changeI++;
                  return channel;
                } else if (lockedChannels?.[i]) {
                  return channel;
                } else {
                  changeI++;
                  return {
                    ...channel,
                    selection: { c, z: 0, t: 0 }
                  };
                }
              })
            }));
            
            // Update both the layers and channel selections
            setRasterLayers(newRasterLayers);
            
            // Force a re-render of channel controllers by updating channel state
            this.setState({
              channels: newRasterLayers[0].channels
            });
          }
        } else {
          // Selecting a neighborhood
          selectNeighborhood(info)
        }
      },
      onHover: (info) => {
        setHoveredCluster(info.object)
      }

    }),
    new deck.TextLayer({
      id: TITLES_LAYER_ID,
      data: showClusterTitles ? (concaveData || []) : [],
      coordinateSystem: deck.COORDINATE_SYSTEM.CARTESIAN,
      pickable: false,
      getPosition: (d) => {
        if (d.centroid) return d.centroid;
        return d.hull[0];
      },
      getText: (d) => {
        const title = d.path.join('-');
        const features = d.features;
        // Sort array of 
        // sort features by value descending
        features.sort((a, b) => b[1] - a[1]);

        // Take  top 3 features
        // Make a string of the names 
        const featureNames = features.slice(0, 3).map((f) => f[0]).join('/');

        return title + '\n' + featureNames;
      },
      getAlignmentBaseline: 'center',
      getColor: [255, 255, 255],
      getSize: 13,
      getTextAnchor: 'middle',
    })

    ];
  }

  createMoleculesLayer(layerDef) {
    const {
      obsLocations,
      obsLocationsFeatureIndex: obsLabelsTypes,
      setMoleculeHighlight,
    } = this.props;
    const getMoleculeColor = (object, { data, index }) => {
      const i = data.src.obsLabelsTypes.indexOf(data.src.obsLabels[index]);
      return data.src.PALETTE[i % data.src.PALETTE.length];
    };
    return new deck.ScatterplotLayer({
      id: MOLECULES_LAYER_ID,
      data: this.obsLocationsData,
      coordinateSystem: deck.COORDINATE_SYSTEM.CARTESIAN,
      pickable: true,
      autoHighlight: true,
      radiusMaxPixels: 3,
      // opacity: layerDef.opacity,
      opacity: 1,
      // visible: layerDef.visible,
      visible: true,
      // getRadius: layerDef.radius,
      getRadius: 100,
      getPosition: (object, { data, index, target }) => {
        // eslint-disable-next-line no-param-reassign
        target[0] = data.src.obsLocations.data[0][index];
        // eslint-disable-next-line no-param-reassign
        target[1] = data.src.obsLocations.data[1][index];
        // eslint-disable-next-line no-param-reassign
        target[2] = 0;
        return target;
      },
      getLineColor: getMoleculeColor,
      getFillColor: getMoleculeColor,
      onHover: (info) => {
        if (setMoleculeHighlight) {
          if (info.object) {
            setMoleculeHighlight(info.object[3]);
          } else {
            setMoleculeHighlight(null);
          }
        }
      },
      updateTriggers: {
        // getRadius: [layerDef],
        getRadius: 10,
        getPosition: [obsLocations],
        getLineColor: [obsLabelsTypes],
        getFillColor: [obsLabelsTypes],
      },
    });
  }

  createNeighborhoodsLayer(layerDef) {
    const {
      getNeighborhoodPolygon = (neighborhoodsEntry) => {
        const neighborhood = neighborhoodsEntry[1];
        return neighborhood.poly;
      },
    } = this.props;
    const { neighborhoodsEntries } = this;

    return new deck.PolygonLayer({
      id: NEIGHBORHOODS_LAYER_ID,
      getPolygon: getNeighborhoodPolygon,
      coordinateSystem: deck.COORDINATE_SYSTEM.CARTESIAN,
      data: neighborhoodsEntries,
      pickable: true,
      autoHighlight: true,
      stroked: true,
      filled: false,
      getElevation: 0,
      getLineWidth: 10,
      visible: layerDef.visible,
    });
  }

  createSelectionLayer() {
    const { obsCentroidsIndex, obsCentroids, reverseLocationsIndex } = this.props;
    const { obsLocations } = this.props;
    const { viewState, setCellSelection } = this.props;
    const { tool } = this.state;
    const { obsSegmentationsQuadTree } = this;

    const getCellCoords = makeDefaultGetObsCoords(obsCentroids);
    const getCellyCoords = (i) => {
      const index = reverseLocationsIndex[i];
      return [obsCentroids.data[0][index], obsCentroids.data[1][index]];
    };
    return getSelectionLayer(tool, viewState.zoom, CELLS_LAYER_ID, [
      {
        getObsCoords: getCellCoords,
        obsIndex: obsCentroidsIndex,
        obsQuadTree: obsSegmentationsQuadTree,
        onSelect: (obsIds) => {
          // console.time("onSelect Timer"); // Start timer
          setCellSelection(obsIds);
          // console.timeEnd("onSelect Timer"); // End timer and log elapsed time
        },
      },
    ]);
  }

  createScaleBarLayer() {
    const {
      viewState,
      width,
      height,
      imageLayerLoaders = {},
      imageLayerDefs,
    } = this.props;
    const use3d = (imageLayerDefs || []).some((i) => i.use3d);
    // Just get the first layer/loader since they should all be spatially
    // resolved and therefore have the same unit size scale.
    const loaders = Object.values(imageLayerLoaders);
    if (!viewState || !width || !height || loaders.length < 1) return null;
    const loader = loaders[0];
    if (!loader) return null;
    const source = getSourceFromLoader(loader);
    if (!source.meta) return null;
    const { physicalSizes } = source.meta;
    if (physicalSizes && !use3d) {
      const { x } = physicalSizes;
      const { unit, size } = x;
      if (unit && size) {
        return new viv.ScaleBarLayer({
          id: "scalebar-layer",
          unit,
          size,
          snap: true,
          viewState: { ...viewState, width, height },
        });
      }
      return null;
    }
    return null;
  }

  createRasterLayer(rawLayerDef, loader, i) {
    const layerDef = {
      ...rawLayerDef,
      channels: rawLayerDef.channels.filter(
        (channel) => channel.selection && channel.color && channel.slider
      ),
    };

    // We need to keep the same selections array reference,
    // otherwise the Viv layer will not be re-used as we want it to,
    // since selections is one of its `updateTriggers`.
    // Reference: https://github.com/hms-dbmi/viv/blob/ad86d0f/src/layers/MultiscaleImageLayer/MultiscaleImageLayer.js#L127
    let selections;
    const nextLoaderSelection = layerDef.channels.map((c) => c.selection);
    const prevLoaderSelection = this.layerLoaderSelections[layerDef.index];
    if (isEqual(prevLoaderSelection, nextLoaderSelection)) {
      selections = prevLoaderSelection;
    } else {
      selections = nextLoaderSelection;
      this.layerLoaderSelections[layerDef.index] = nextLoaderSelection;
    }
    const useTransparentColor =
      (!layerDef.visible && typeof layerDef.visible === "boolean") ||
      Boolean(layerDef.transparentColor);
    const transparentColor = useTransparentColor ? [0, 0, 0] : null;
    const layerProps = {
      colormap: layerDef.colormap,
      opacity: layerDef.opacity,
      useTransparentColor,
      transparentColor,
      colors: layerDef.channels.map((c) => c.color),
      sliders: layerDef.channels.map((c) => c.slider),
      resolution: layerDef.resolution,
      renderingMode: layerDef.renderingMode,
      xSlice: layerDef.xSlice,
      ySlice: layerDef.ySlice,
      zSlice: layerDef.zSlice,
      callback: layerDef.callback,
      visibilities: layerDef.channels.map((c) =>
        !layerDef.visible && typeof layerDef.visible === "boolean"
          ? false
          : c.visible
      ),
      excludeBackground: useTransparentColor,
    };
    if (!loader || !layerProps) return null;
    const {
      metadata: { transform },
      data,
    } = loader;
    let modelMatrix;
    if (transform) {
      const { scale, translate } = transform;
      modelMatrix = new Matrix4()
        .translate([translate.x, translate.y, 0])
        .scale(scale);
    } else if (layerDef.modelMatrix) {
      // eslint-disable-next-line prefer-destructuring
      modelMatrix = new Matrix4(layerDef.modelMatrix);
    }
    if (rawLayerDef.type === "bitmask") {
      const {
        geneExpressionColormap,
        geneExpressionColormapRange = [0.0, 1.0],
        cellColorEncoding,
      } = this.props;
      return new viv.MultiscaleImageLayer({
        // `bitmask` is used by the AbstractSpatialOrScatterplot
        // https://github.com/vitessce/vitessce/pull/927/files#diff-9cab35a2ca0c5b6d9754b177810d25079a30ca91efa062d5795181360bc3ff2cR111
        id: `bitmask-layer-${layerDef.index}-${i}`,
        channelsVisible: layerProps.visibilities,
        opacity: layerProps.opacity,
        modelMatrix,
        hoveredCell: Number(this.props.cellHighlight),
        renderSubLayers: renderSubBitmaskLayers,
        loader: data,
        selections,
        // For some reason, deck.gl doesn't recognize the prop diffing
        // unless these are separated out.  I don't think it's a bug, just
        // has to do with the fact that we don't have it in the `defaultProps`,
        // could be wrong though.
        cellColorData: this.color.data,
        cellTexHeight: this.color.height,
        cellTexWidth: this.color.width,
        excludeBackground: true,
        onViewportLoad: layerProps.callback,
        colorScaleLo: geneExpressionColormapRange[0],
        colorScaleHi: geneExpressionColormapRange[1],
        isExpressionMode: cellColorEncoding === "geneSelection",
        colormap: geneExpressionColormap,
        expressionData: this.expression.data,
        selectedBackground: this.props.selectedBackground,
        selectedSelection: this.props.selectedSelection,
        // There is no onHover here,
        // see the onHover method of AbstractSpatialOrScatterplot.
      });
    }
    const [Layer, layerLoader] = getLayerLoaderTuple(data, layerDef.use3d);
    console.log('layerLoader', layerLoader)

    const extensions = getVivLayerExtensions(
      layerDef.use3d,
      layerProps.colormap,
      layerProps.renderingMode
    );
    // Safer to only use this prop when we have an interleaved image i.e not multiple channels.
    const rgbInterleavedProps = {};
    if (isInterleaved((Array.isArray(data) ? data[0] : data).shape)) {
      rgbInterleavedProps.visible = layerDef.visible;
    }
    return new Layer({
      loader: layerLoader,
      id: `${layerDef.use3d ? "volume" : "image"}-layer-${layerDef.index}-${i}`,
      colors: layerProps.colors,
      contrastLimits: layerProps.sliders,
      selections,
      channelsVisible: layerProps.visibilities,
      opacity: layerProps.opacity,
      colormap: layerProps.colormap,
      modelMatrix,
      transparentColor: layerProps.transparentColor,
      useTransparentColor: layerProps.useTransparentColor,
      resolution: layerProps.resolution,
      renderingMode: layerProps.renderingMode,
      pickable: false,
      xSlice: layerProps.xSlice,
      ySlice: layerProps.ySlice,
      zSlice: layerProps.zSlice,
      onViewportLoad: layerProps.callback,
      excludeBackground: layerProps.excludeBackground,
      
      extensions,
      ...rgbInterleavedProps,
    });
  }

  use3d() {
    const { imageLayerDefs } = this.props;
    return (imageLayerDefs || []).some((i) => i.use3d);
  }

  createImageLayers() {
    const {
      imageLayerDefs,
      imageLayerLoaders = {},
      imageLayerCallbacks = [],
    } = this.props;
    const use3d = this.use3d();
    const use3dIndex = (imageLayerDefs || []).findIndex((i) => i.use3d);
    return (imageLayerDefs || [])
      .filter((layer) => (use3d ? layer.use3d === use3d : true))
      .map((layer, i) =>
        this.createRasterLayer(
          { ...layer, callback: imageLayerCallbacks[use3d ? use3dIndex : i] },
          imageLayerLoaders[layer.index],
          i
        )
      );
  }

  createBitmaskLayers() {
    const {
      obsSegmentationsLayerDefs,
      obsSegmentations,
      obsSegmentationsType,
      segmentationLayerCallbacks = [],
    } = this.props;
    if (
      obsSegmentations &&
      obsSegmentationsType === "bitmask" &&
      Array.isArray(obsSegmentationsLayerDefs)
    ) {
      const { loaders = [] } = obsSegmentations;
      const use3d = obsSegmentationsLayerDefs.some((i) => i.use3d);
      const use3dIndex = obsSegmentationsLayerDefs.findIndex((i) => i.use3d);
      return obsSegmentationsLayerDefs
        .filter((layer) => (use3d ? layer.use3d === use3d : true))
        .map((layer, i) =>
          this.createRasterLayer(
            {
              ...layer,
              callback: segmentationLayerCallbacks[use3d ? use3dIndex : i],
            },
            loaders[layer.index],
            i
          )
        );
    }
    return [];
  }

  getLayers() {
    const {
      imageLayers,
      obsSegmentationsPolygonLayer,
      neighborhoodsLayer,
      obsLocationsLayer,
      obsSegmentationsBitmaskLayers,
    } = this;
    const layers = [
      ...imageLayers,
      ...obsSegmentationsBitmaskLayers,
      ...obsSegmentationsPolygonLayer,
      neighborhoodsLayer,
      obsLocationsLayer,
      this.createScaleBarLayer(),
      this.createSelectionLayer(),
    ];
    return layers;
  }

  onUpdateCellsData() {
    const { obsSegmentations, obsSegmentationsType, obsCentroids } = this.props;
    if (
      (obsSegmentations && obsSegmentationsType === "polygon") ||
      (obsCentroids)
    ) {
      const getCellCoords = makeDefaultGetObsCoords(obsCentroids);

      this.obsSegmentationsQuadTree = createQuadTree(
        obsCentroids,
        getCellCoords
      );
      this.obsSegmentationsData = {
        src: {
          obsSegmentations,
          obsCentroids,
        },
        length: obsCentroids.shape[1] || obsSegmentations?.shape?.[0]
      };
    }
  }

  onUpdateCellsLayer() {
    const {
      obsSegmentationsLayerDefs: obsSegmentationsLayerDef,
      obsSegmentationsIndex,
      obsSegmentations,
      obsSegmentationsType,
      obsCentroids,
      obsCentroidsIndex,
      hasSegmentations,
      concavePolygon
    } = this.props;
    if (
      (obsSegmentationsLayerDef &&
        obsSegmentationsIndex &&
        obsSegmentations &&
        obsSegmentationsType === "polygon") || (true)
    ) {
      this.obsSegmentationsPolygonLayer = this.createPolygonSegmentationsLayer(
        obsSegmentationsLayerDef,
        true
      );
    } if (
      obsSegmentationsLayerDef &&
      obsSegmentations &&
      obsSegmentationsType === "bitmask"
    ) {
      this.obsSegmentationsBitmaskLayers = this.createBitmaskLayers();
    } else if (
      !hasSegmentations &&
      obsSegmentationsLayerDef &&
      !obsSegmentations &&
      !obsSegmentationsIndex &&
      obsCentroids &&
      obsCentroidsIndex
    ) {
      // For backwards compatibility (diamond case).
      this.obsSegmentationsPolygonLayer = this.createPolygonSegmentationsLayer(
        obsSegmentationsLayerDef,
        false
      );
    }
    // else {
    //   this.obsSegmentationsPolygonLayer = null;
    // }
  }

  onUpdateCellColors() {
    const color = this.randomColorData;
    const { size } = this.props.cellColors;
    if (typeof size === "number") {
      const cellIds = this.props.cellColors.keys();
      color.data = new Uint8Array(color.height * color.width * 3).fill(
        getDefaultColor(this.props.theme)[0]
      );
      // 0th cell id is the empty space of the image i.e black color.
      color.data[0] = 0;
      color.data[1] = 0;
      color.data[2] = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const id of cellIds) {
        if (id > 0) {
          const cellColor = this.props.cellColors.get(id);
          if (cellColor) {
            color.data.set(cellColor.slice(0, 3), Number(id) * 3);
          }
        }
      }
    }
    this.color = color;
  }

  onUpdateExpressionData() {
    const { expressionData } = this.props;
    if (expressionData[0]?.length) {
      this.expression.data = new Uint8Array(
        this.expression.height * this.expression.width
      );
      this.expression.data.set(expressionData[0]);
    }
  }

  onUpdateMoleculesData() {
    const {
      obsLocations,
      obsLocationsLabels: obsLabels,
      obsLocationsFeatureIndex: obsLabelsTypes,
    } = this.props;
    if (obsLocations && obsLabels && obsLabelsTypes) {
      this.obsLocationsData = {
        src: {
          obsLabels,
          obsLocations,
          obsLabelsTypes,
          PALETTE,
        },
        length: obsLocations.shape[1],
      };
    }
  }

  onUpdateMoleculesLayer() {
    const {
      obsLocationsLayerDefs: obsLocationsLayerDef,
      obsLocations,
      obsLocationsIndex,
      obsLocationsLabels,
      obsLocationsFeatureIndex,
    } = this.props;
    if (
      // this.showScatterplot() &&

      // obsLocationsLayerDef &&
      obsLocations?.data &&
      obsLocationsIndex &&
      obsLocationsLabels &&
      obsLocationsFeatureIndex
    ) {

      this.obsLocationsLayer = this.createMoleculesLayer(obsLocationsLayerDef);
    } else {
      this.obsLocationsLayer = null;
    }
  }

  onUpdateNeighborhoodsData() {
    const { neighborhoods = {} } = this.props;
    const neighborhoodsEntries = Object.entries(neighborhoods);
    this.neighborhoodsEntries = neighborhoodsEntries;
  }

  onUpdateNeighborhoodsLayer() {
    const { neighborhoodLayerDefs: neighborhoodLayerDef } = this.props;
    if (neighborhoodLayerDef) {
      this.neighborhoodsLayer =
        this.createNeighborhoodsLayer(neighborhoodLayerDef);
    } else {
      this.neighborhoodsLayer = null;
    }
  }

  onUpdateImages() {
    this.imageLayers = this.createImageLayers();
  }

  viewInfoDidUpdate() {
    const { obsCentroidsIndex, obsCentroids } = this.props;
    super.viewInfoDidUpdate(
      obsCentroidsIndex,
      obsCentroids,
      makeDefaultGetObsCoords
    );
  }

  recenter() {
    const { originalViewState, setViewState } = this.props;
    if (
      Array.isArray(originalViewState?.target) &&
      typeof originalViewState?.zoom === "number"
    ) {
      setViewState(originalViewState);
    }
  }

  /**
   * Here, asynchronously check whether props have
   * updated which require re-computing memoized variables,
   * followed by a re-render.
   * This function does not follow React conventions or paradigms,
   * it is only implemented this way to try to squeeze out
   * performance.
   * @param {object} prevProps The previous props to diff against.
   */
  componentDidUpdate(prevProps) {
    this.viewInfoDidUpdate();
    // console.log('update', this.props, this.state)

    const shallowDiff = (propName) =>
      prevProps[propName] !== this.props[propName];
    let forceUpdate = false;

    if (
      ["obsSegmentations", "obsSegmentationsType", "obsCentroids"].some(
        shallowDiff
      )
    ) {
      // Cells data changed.
      this.onUpdateCellsData();
      forceUpdate = true;
    }

    if (["hoverClusterOpacities", "showClusterOutlines", "showClusterTitles", "selectedBackground", "selectedSelection"].some(shallowDiff)) {
      this.onUpdateCellsLayer()
      forceUpdate = true;
    }

    if (["cellColors"].some(shallowDiff)) {
      // Cells Color layer props changed.
      // Must come before onUpdateCellsLayer
      // since the new layer may use the new processed color data.
      this.onUpdateCellColors();
      forceUpdate = true;
    }

    if (["expressionData",].some(shallowDiff)) {
      // Expression data prop changed.
      // Must come before onUpdateCellsLayer
      // since the new layer may use the new processed expression data.
      this.onUpdateExpressionData();
      forceUpdate = true;
    }

    if (
      [
        "obsSegmentationsLayerDefs",
        "obsSegmentations",
        "obsSegmentationsIndex",
        "obsSegmentationsType",
        "obsCentroids",
        "obsCentroidsIndex",
        "hasSegmentations",
        "cellFilter",
        "cellSelection",
        "geneExpressionColormapRange",
        "expressionData",
        "cellColorEncoding",
        "geneExpressionColormap",
        "segmentationLayerCallbacks",
      ].some(shallowDiff)
    ) {
      // Cells layer props changed.
      this.onUpdateCellsLayer();
      forceUpdate = true;
    }

    if (
      ["obsLocations", "obsLocationsLabels", "obsLocationsFeatureIndex"].some(
        shallowDiff
      )
    ) {
      // Molecules data props changed.
      this.onUpdateMoleculesData();
      forceUpdate = true;
    }

    if (
      [
        "obsLocationsLayerDefs",
        "obsLocations",
        "obsLocationsIndex",
        "obsLocationsLabels",
        "obsLocationsFeatureIndex",
      ].some(shallowDiff)
    ) {
      // Molecules layer props changed.
      this.onUpdateMoleculesLayer();
      forceUpdate = true;
    }

    if (["neighborhoods"].some(shallowDiff)) {
      // Neighborhoods data changed.
      this.onUpdateNeighborhoodsData();
      forceUpdate = true;
    }

    if (["neighborhoodLayerDefsDefs", "neighborhoods"].some(shallowDiff)) {
      // Neighborhoods layer props changed.
      this.onUpdateNeighborhoodsLayer();
      forceUpdate = true;
    }

    if (
      [
        "imageLayerDefs",
        "imageLayerLoaders",
        "cellColors",
        "cellHighlight",
        "geneExpressionColormapRange",
        "expressionData",
        "imageLayerCallbacks",
        "geneExpressionColormap",
      ].some(shallowDiff)
    ) {
      // Image layers changed.
      this.onUpdateImages();
      forceUpdate = true;
    }
    if (forceUpdate) {
      this.forceUpdate();
    }
  }

  // render() is implemented in the abstract parent class.
}

/**
 * Need this wrapper function here,
 * since we want to pass a forwardRef
 * so that outer components can
 * access the grandchild DeckGL ref,
 * but we are using a class component.
 */
const SpatialWrapper = forwardRef((props, deckRef) => (
  <Spatial {...props} deckRef={deckRef} />
));
SpatialWrapper.displayName = "SpatialWrapper";

/**
 * A subscriber component for the spatial plot.
 * @param {object} props
 * @param {string} props.theme The current theme name.
 * @param {object} props.coordinationScopes The mapping from coordination types to coordination
 * scopes.
 * @param {function} props.removeGridComponent The callback function to pass to TitleInfo,
 * to call when the component has been removed from the grid.
 * @param {string} props.title The component title.
 */
export function SpotlightSubscriber(props) {
  const {
    uuid,
    coordinationScopes,
    closeButtonVisible,
    downloadButtonVisible,
    removeGridComponent,
    observationsLabelOverride,
    subobservationsLabelOverride: subobservationsLabel = "molecule",
    theme,
    title = "Spatial",
    disable3d,
    globalDisable3d,
    useFullResolutionImage = {},
    channelNamesVisible = false,
  } = props;

  const loaders = useLoaders();
  const setComponentHover = useSetComponentHover();
  const setComponentViewInfo = useSetComponentViewInfo(uuid);

  // Get "props" from the coordination space.
  const [
    {
      dataset,
      obsType,
      featureType,
      featureValueType,
      spatialZoom: zoom,
      spatialTargetX: targetX,
      spatialTargetY: targetY,
      spatialTargetZ: targetZ,
      spatialRotationX: rotationX,
      spatialRotationY: rotationY,
      spatialRotationZ: rotationZ,
      spatialRotationOrbit: rotationOrbit,
      spatialOrbitAxis: orbitAxis,
      spatialImageLayer: imageLayers,
      spatialSegmentationLayer: cellsLayer,
      spatialPointLayer: moleculesLayer,
      spatialNeighborhoodLayer: neighborhoodsLayer,
      obsFilter: cellFilter,
      obsHighlight: cellHighlight,
      featureSelection: geneSelection,
      obsSetSelection: cellSetSelection,
      obsSetColor: cellSetColor,
      obsColorEncoding: cellColorEncoding,
      additionalObsSets: additionalCellSets,
      spatialAxisFixed,
      featureValueColormap: geneExpressionColormap,
      featureValueColormapRange: geneExpressionColormapRange,
      tooltipsVisible,
      spatialImageLayer: rasterLayers,

    },
    {
      setSpatialZoom: setZoom,
      setSpatialTargetX: setTargetX,
      setSpatialTargetY: setTargetY,
      setSpatialTargetZ: setTargetZ,
      setSpatialRotationX: setRotationX,
      setSpatialRotationOrbit: setRotationOrbit,
      setSpatialOrbitAxis: setOrbitAxis,
      setSpatialImageLayer: setRasterLayers,
      setSpatialSegmentationLayer: setCellsLayer,
      setSpatialPointLayer: setMoleculesLayer,
      setSpatialNeighborhoodLayer: setNeighborhoodsLayer,
      setObsFilter: setCellFilter,
      setObsSetSelection: setCellSetSelection,
      setObsHighlight: setCellHighlight,
      setObsSetColor: setCellSetColor,
      setObsColorEncoding: setCellColorEncoding,
      setAdditionalObsSets: setAdditionalCellSets,
      setMoleculeHighlight,
      setSpatialAxisFixed,
      setFeatureValueColormap: setGeneExpressionColormap,
      setFeatureValueColormapRange: setGeneExpressionColormapRange,
      setTooltipsVisible,
    },
  ] = useCoordination(
    COMPONENT_COORDINATION_TYPES[ViewType.SPATIAL],
    coordinationScopes
  );

  const {
    spatialZoom: initialZoom,
    spatialTargetX: initialTargetX,
    spatialTargetY: initialTargetY,
    spatialTargetZ: initialTargetZ,
  } = useInitialCoordination(
    COMPONENT_COORDINATION_TYPES[ViewType.SPATIAL],
    coordinationScopes
  );

  const observationsLabel = observationsLabelOverride || obsType;

  const [{ imageLayerCallbacks, segmentationLayerCallbacks }] =
    useAuxiliaryCoordination(
      COMPONENT_COORDINATION_TYPES.layerController,
      coordinationScopes
    );

  const use3d = imageLayers?.some((l) => l.use3d);

  const [width, height, deckRef] = useDeckCanvasSize();

  const [obsLabelsTypes, obsLabelsData] = useMultiObsLabels(
    coordinationScopes,
    obsType,
    loaders,
    dataset
  );

  const hasExpressionData = useHasLoader(
    loaders,
    dataset,
    DataType.OBS_FEATURE_MATRIX,
    { obsType, featureType, featureValueType }
    // TODO: get per-spatialLayerType expression data once #1240 is merged.
  );
  const hasSegmentationsLoader = useHasLoader(
    loaders,
    dataset,
    DataType.OBS_SEGMENTATIONS,
    { obsType } // TODO: use obsType in matchOn once #1240 is merged.
  );
  const hasLocationsData = useHasLoader(
    loaders,
    dataset,
    DataType.OBS_LOCATIONS,
    { obsType } // TODO: use obsType in matchOn once #1240 is merged.
  );
  const hasImageData = useHasLoader(
    loaders,
    dataset,
    DataType.IMAGE,
    {} // TODO: which properties to match on. Revisit after #830.
  );
  // Get data from loaders using the data hooks.
  const [
    { obsIndex: obsLocationsIndex, obsLocations },
    obsLocationsStatus,
    obsLocationsUrls,
  ] = useObsLocationsData(
    loaders,
    dataset,
    false,
    { setSpatialPointLayer: setMoleculesLayer },
    { spatialPointLayer: moleculesLayer },
    { obsType: "molecule" } // TODO: use dynamic obsType in matchOn once #1240 is merged.
  );
  const [{ obsLabels: obsLocationsLabels }, obsLabelsStatus, obsLabelsUrls] =
    useObsLabelsData(
      loaders,
      dataset,
      false,
      {},
      {},
      { obsType: "molecule" } // TODO: use obsType in matchOn once #1240 is merged.
    );
  const [
    { obsIndex: obsCentroidsIndex, obsLocations: obsCentroids },
    obsCentroidsStatus,
    obsCentroidsUrls,
  ] = useObsLocationsData(
    loaders,
    dataset,
    false,
    {},
    {},
    { obsType } // TODO: use dynamic obsType in matchOn once #1240 is merged.
  );
  const [
    { obsIndex: obsSegmentationsIndex, obsSegmentations, obsSegmentationsType },
    obsSegmentationsStatus,
    obsSegmentationsUrls,
  ] = useObsSegmentationsData(
    loaders,
    dataset,
    false,
    { setSpatialSegmentationLayer: setCellsLayer },
    { spatialSegmentationLayer: cellsLayer },
    { obsType } // TODO: use obsType in matchOn once #1240 is merged.
  );
  // In the case of obsSegmentations.raster.json files that have been
  // auto-upgraded from raster.json in older config versions,
  // it is possible to have an obsSegmentations file type in the dataset,
  // but one that returns `null` if all of the raster layers end up being
  // images rather than segmentation bitmasks.
  const hasSegmentationsData =
    hasSegmentationsLoader &&
    !(
      obsSegmentationsStatus === STATUS.SUCCESS &&
      !(obsSegmentations || obsSegmentationsType)
    );
  const [{ obsSets: cellSets, obsSetsMembership }, obsSetsStatus, obsSetsUrls] =
    useObsSetsData(
      loaders,
      dataset,
      false,
      {
        setObsSetSelection: setCellSetSelection,
        setObsSetColor: setCellSetColor,
      },
      { obsSetSelection: cellSetSelection, obsSetColor: cellSetColor },
      { obsType }
    );
  // eslint-disable-next-line no-unused-vars
  const [expressionData, loadedFeatureSelection, featureSelectionStatus] =
    useFeatureSelection(loaders, dataset, false, geneSelection, {
      obsType,
      featureType,
      featureValueType,
    });
  const [{ obsIndex: matrixObsIndex }, matrixIndicesStatus, matrixIndicesUrls] =
    useObsFeatureMatrixIndices(loaders, dataset, false, {
      obsType,
      featureType,
      featureValueType,
    });
  const [{ image }, imageStatus, imageUrls] = useImageData(
    loaders,
    dataset,
    false,
    { setSpatialImageLayer: setRasterLayers },
    { spatialImageLayer: imageLayers },
    {} // TODO: which properties to match on. Revisit after #830.
  );
  const { loaders: imageLayerLoaders = [], meta = [] } = image || {};
  const [neighborhoods, neighborhoodsStatus, neighborhoodsUrls] =
    useNeighborhoodsData(
      loaders,
      dataset,
      false,
      { setSpatialNeighborhoodLayer: setNeighborhoodsLayer },
      { spatialNeighborhoodLayer: neighborhoodsLayer }
    );
  const [{ featureLabelsMap }, featureLabelsStatus, featureLabelsUrls] =
    useFeatureLabelsData(loaders, dataset, false, {}, {}, { featureType });

  const isReady = useReady([
    obsLocationsStatus,
    obsLabelsStatus,
    obsCentroidsStatus,
    obsSegmentationsStatus,
    obsSetsStatus,
    featureSelectionStatus,
    matrixIndicesStatus,
    imageStatus,
    neighborhoodsStatus,
    featureLabelsStatus,
  ]);
  const urls = useUrls([
    obsLocationsUrls,
    obsLabelsUrls,
    obsCentroidsUrls,
    obsSegmentationsUrls,
    obsSetsUrls,
    matrixIndicesUrls,
    imageUrls,
    neighborhoodsUrls,
    featureLabelsUrls,
  ]);

  const obsLocationsFeatureIndex = useMemo(() => {
    if (obsLocationsLabels) {
      return Array.from(new Set(obsLocationsLabels));
    }
    return null;
  }, [obsLocationsLabels]);
  const moleculesCount = obsLocationsFeatureIndex?.length || 0;
  const locationsCount = obsLocationsIndex?.length || 0;


  const [originalViewState, setOriginalViewState] = useState(null);

  const selectionPath = useStore((state) => state.selectionPath)
  const lockedChannels = useStore((state) => state.lockedChannels)
  const hoverClusterOpacities = useStore((state) => state.hoverClusterOpacities)
  const setHoverClusterOpacities = useStore((state) => state.setHoverClusterOpacities)
  const setFeatures = useStore((state) => state.setFeatures)
  const setSetFeatures = useStore((state) => state.setSetFeatures)
  const hoveredClusters = useStore((state) => state.hoveredClusters)
  const setHoveredClusters = useStore((state) => state.setHoveredClusters)
  const showClusterOutlines = useStore((state) => state.showClusterOutlines);
  const showClusterTitles = useStore((state) => state.showClusterTitles);
  const hoveredCluster = useStore((state) => state.hoveredCluster);
  const setHoveredCluster = useStore((state) => state.setHoveredCluster);
  const selectedBackground = useStore((state) => state.selectedBackground)
  const selectedSelection = useStore((state) => state.selectedSelection)



  const reverseLocationsIndex = useMemo(() => {
    return obsLocationsIndex?.reduce((acc, val, i) => {
      acc[val] = i;
      return acc;
    }, {});
  }, [obsLocationsIndex]);



  // Compute initial viewState values to use if targetX and targetY are not
  // defined in the initial configuration.
  const {
    initialTargetX: defaultTargetX,
    initialTargetY: defaultTargetY,
    initialTargetZ: defaultTargetZ,
    initialZoom: defaultZoom,
  } = useMemo(
    () =>
      getInitialSpatialTargets({
        width,
        height,
        obsCentroids,
        obsSegmentations,
        obsSegmentationsType,
        // TODO: use obsLocations (molecules) here too.
        imageLayerLoaders,
        useRaster: Boolean(hasImageData),
        use3d,
        modelMatrices: meta.map(({ metadata }) => metadata?.transform?.matrix),
      }),
    // Deliberate dependency omissions: imageLayerLoaders and meta - using `image` as
    // an indirect dependency instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      image,
      use3d,
      hasImageData,
      obsCentroids,
      obsSegmentations,
      obsSegmentationsType,
      width,
      height,
    ]
  );

  useEffect(() => {
    // If it has not already been set, set the initial view state using
    // the auto-computed values from the useMemo above.
    if (
      typeof initialTargetX !== "number" ||
      typeof initialTargetY !== "number"
    ) {
      const notYetInitialized =
        typeof targetX !== "number" || typeof targetY !== "number";
      const stillDefaultInitialized =
        targetX === defaultTargetX && targetY === defaultTargetY;
      if (notYetInitialized || stillDefaultInitialized) {
        setTargetX(defaultTargetX);
        setTargetY(defaultTargetY);
        setTargetZ(defaultTargetZ);
        setZoom(defaultZoom);
      }
      setOriginalViewState({
        target: [defaultTargetX, defaultTargetY, defaultTargetZ],
        zoom: defaultZoom,
      });
    } else if (!originalViewState) {
      // originalViewState has not yet been set and
      // the view config defined an initial viewState.
      setOriginalViewState({
        target: [initialTargetX, initialTargetY, initialTargetZ],
        zoom: initialZoom,
      });
    }
    // Deliberate dependency omissions: targetX, targetY
    // since we do not this to re-run on every single zoom/pan interaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    defaultTargetX,
    defaultTargetY,
    defaultTargetZ,
    defaultZoom,
    initialTargetX,
    initialTargetY,
    initialTargetZ,
    initialZoom,
  ]);




  const mergedCellSets = useMemo(
    () => mergeObsSets(cellSets, additionalCellSets),
    [cellSets, additionalCellSets]
  );








  const [hoverSelection, setHoverSelection] = useState(null);

  useEffect(() => {
    if (!mergedCellSets || !cellSetSelection) return;
    if (!hoveredCluster) setHoverClusterOpacities(null)
    else {
      console.log('hoveredCluster', hoveredCluster)
      const highlightedNode = treeFindNodeByNamePath(mergedCellSets, hoveredCluster.path);
      const highlightedSet = new Set(highlightedNode?.set?.map((cell) => `${cell[0]}`));
      console.log('highlightedSet', highlightedSet, highlightedNode)

      const opacityMap = new Map();
      cellSetSelection.forEach((set) => {
        const thisSet = new Set(treeFindNodeByNamePath(mergedCellSets, set)?.set?.map((cell) => `${cell[0]}`));
        const overlap = highlightedSet.intersection(thisSet);
        const percentOverlap = overlap.size / highlightedSet.size;
        opacityMap.set(JSON.stringify(set), percentOverlap);
      });
      console.log('opacityMap', opacityMap, highlightedSet)
      setHoverClusterOpacities(opacityMap)
    }
  }, [hoveredCluster, mergedCellSets, cellSetSelection])

  useEffect(() => {
    // Iterate over objects in hoveredClusters
    const clusterList = Object.keys(hoveredClusters)
    const anyHovered = clusterList.map((key) => {
      return hoveredClusters[key]
    }).some(Boolean)
    if (!anyHovered) {
      setHoverSelection(null)
      return;
    };
    const firstSet = clusterList?.[0]
    const secondSet = clusterList?.[1]
    let setA, setB = null;
    if (firstSet && hoveredClusters[firstSet]) {
      const path = JSON.parse(firstSet)
      setA = new Set(treeFindNodeByNamePath(mergedCellSets, path).set.map((cell) => cell[0]));
    }
    if (secondSet && hoveredClusters[secondSet]) {
      const path = JSON.parse(secondSet)
      setB = new Set(treeFindNodeByNamePath(mergedCellSets, path).set.map((cell) => cell[0]));
    }
    let selection = new Set();
    if (setA && setB) {
      const intersection = setA.intersection(setB);
      intersection.forEach(cell => selection.add(cell));
    } else if (setA) {
      setA.forEach(cell => selection.add(cell));
    } else if (setB) {
      setB.forEach(cell => selection.add(cell));
    }
    let selectArray = Array.from(selection);
    setHoverSelection(selectArray)

  }, [hoveredClusters])


  const selectNeighborhood = useCallback((info) => {
    const path = info?.object?.path
    if (!path) return;
    const set = treeFindNodeByNamePath(mergedCellSets, path)
    if (!set) return;
    const fetchNeighborhoodData = async (path, setSelection) => {
      const neighborhoodUrl = "http://localhost:8181/neighborhood";
      const neighborhoodPost = await fetch(neighborhoodUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...setSelection, path }),
      });
      const neighborhoodData = await neighborhoodPost.json();
      console.log('neighborhoodData', neighborhoodData)
      setObsSelection(
        neighborhoodData?.neighbors || [], additionalCellSets, cellSetColor,
        setCellSetSelection, setAdditionalCellSets, setCellSetColor,
        setCellColorEncoding,
        'Neighborhood ',
      );

    }
    fetchNeighborhoodData(path, set)

  }, [mergedCellSets, cellSetColor,
    setCellSetSelection, setAdditionalCellSets, setCellSetColor,
    setCellColorEncoding])





  useEffect(() => {
    setTooltipsVisible(false)
  }, [tooltipsVisible])





  useEffect(() => {
    const fetchSelectionData = async (sets, path, setSelection) => {
      if (!path || path?.length == 0) return;

      // Check if path is in setFeatures
      if (!setFeatures[path[0]]) setSetFeatures({ ...setFeatures, [path[0]]: {} });
      if (setFeatures[path[0]]?.[path[1]]?.hulls) return;

      const selectionUrl = "http://localhost:8181/selection";

      const selectionPost = await fetch(selectionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...setSelection, path }),
      });
      const selectionData = await selectionPost.json();
      const newSetFeature = { [path[0]]: { ...setFeatures[path[0]], [path[1]]: selectionData?.data } };
      // setSetFeatures(newSetFeatures);
      return newSetFeature;
    };
    if (!cellSetSelection || cellSetSelection?.length == 0) return;
    Promise.all(cellSetSelection.map(selp => {
      const inAdditionalSets = additionalCellSets ? treeFindNodeByNamePath(additionalCellSets, selp) : null;
      const inMainSets = cellSets ? treeFindNodeByNamePath(cellSets, selp) : cellSets;
      if (inAdditionalSets) {
        return fetchSelectionData(additionalCellSets, selp, inAdditionalSets, setFeatures);
        // check if the set has features and concavity
      } else if (inMainSets) {
        // check if the set has features and concavity
        return fetchSelectionData(cellSets, selp, inMainSets, setFeatures);
      }
    }))
      .then((newSetFeatures) => {
        const allNewFeatures = merge(setFeatures, ...newSetFeatures);
        setSetFeatures(allNewFeatures);
      })






  }, [cellSetSelection, additionalCellSets, cellSets, selectionPath])

  const setCellSelectionProp = useCallback(
    (v) => {
      setObsSelection(
        v,
        additionalCellSets,
        cellSetColor,
        setCellSetSelection,
        setAdditionalCellSets,
        setCellSetColor,
        setCellColorEncoding
      );
    },
    [
      additionalCellSets,
      cellSetColor,
      setCellColorEncoding,
      setAdditionalCellSets,
      setCellSetColor,
      setCellSetSelection,
    ]
  );




  const customGetCellColors = ({ cellSets, cellSetSelection, cellSetColor, obsIndex, theme, hoverSelection }) => {
    let colorMap = new Map();
    if (!hoverSelection) {
      colorMap = getCellColors({ cellSets, cellSetSelection, cellSetColor, obsIndex, theme })
    }
    else {
      hoverSelection.map(cell => {
        colorMap.set(`${cell}`, [255, 0, 0])
      })
    }
    return colorMap
  }

  const cellColors = useMemo(
    () =>

      customGetCellColors({
        cellSets: mergedCellSets,
        cellSetSelection,
        cellSetColor,
        obsIndex: matrixObsIndex,
        theme,
        hoverSelection
      }),
    [mergedCellSets, theme, cellSetColor, cellSetSelection, matrixObsIndex, hoverSelection]
  );

  const cellSelection = useMemo(
    () => Array.from(cellColors.keys()),
    [cellColors]
  );

  const getObsInfo = useGetObsInfo(
    observationsLabel,
    obsLabelsTypes,
    obsLabelsData,
    obsSetsMembership
  );

  const [hoverData, setHoverData] = useState(null);
  const [hoverCoord, setHoverCoord] = useState(null);

  // Should hover position be used for tooltips?
  // If there are centroids for each observation, then we can use those
  // to position tooltips. However if there are not centroids,
  // the other option is to use the mouse location.
  const useHoverInfoForTooltip = !obsCentroids;

  const setHoverInfo = useCallback(
    debounce(
      (data, coord) => {
        setHoverData(data);
        setHoverCoord(coord);
      },
      10,
      { trailing: true }
    ),
    [setHoverData, setHoverCoord, useHoverInfoForTooltip]
  );

  const getObsIdFromHoverData = useCallback(
    (data) => {
      if (useHoverInfoForTooltip) {
        // TODO: When there is support for multiple segmentation channels that may
        // contain different obsTypes, then do not hard-code the zeroth channel.
        const spatialTargetC = 0;
        const obsId = data?.[spatialTargetC];
        return obsId;
      }
      return null;
    },
    [useHoverInfoForTooltip]
  );

  const setViewState = ({
    zoom: newZoom,
    target,
    rotationX: newRotationX,
    rotationOrbit: newRotationOrbit,
    orbitAxis: newOrbitAxis,
  }) => {
    setZoom(newZoom);
    setTargetX(target[0]);
    setTargetY(target[1]);
    setTargetZ(target[2] || null);
    setRotationX(newRotationX);
    setRotationOrbit(newRotationOrbit);
    setOrbitAxis(newOrbitAxis || null);
  };

  const subtitle = makeSpatialSubtitle({
    observationsCount: obsSegmentationsIndex?.length || matrixObsIndex?.length,
    observationsLabel,
    subobservationsCount: moleculesCount,
    subobservationsLabel,
    locationsCount,
  });

  const {
    normData: uint8ExpressionData,
    extents: expressionExtents,
  } = useUint8FeatureSelection(expressionData);

  // The bitmask layer needs access to a array (i.e a texture) lookup of cell -> expression value
  // where each cell id indexes into the array.
  // Cell ids in `attrs.rows` do not necessaryily correspond to indices in that array, though,
  // so we create a "shifted" array where this is the case.
  const shiftedExpressionDataForBitmask = useMemo(() => {
    if (
      matrixObsIndex &&
      uint8ExpressionData &&
      obsSegmentationsType === "bitmask"
    ) {
      const maxId = matrixObsIndex.reduce((max, curr) =>
        Math.max(max, Number(curr))
      );
      const result = new Uint8Array(maxId + 1);
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < matrixObsIndex.length; i++) {
        const id = matrixObsIndex[i];
        result.set(uint8ExpressionData[0].slice(i, i + 1), Number(id));
      }
      return [result];
    }
    return [new Uint8Array()];
  }, [matrixObsIndex, uint8ExpressionData, obsSegmentationsType]);

  // Set up a getter function for gene expression values, to be used
  // by the DeckGL layer to obtain values for instanced attributes.
  const getExpressionValue = useExpressionValueGetter({
    // eslint-disable-next-line no-unneeded-ternary
    instanceObsIndex: obsSegmentationsIndex
      ? // When there are polygon cell segmentations.
      obsSegmentationsIndex
      : // When there are not polygon cell segmentations, and we need to make fake diamonds.
      obsCentroidsIndex,
    matrixObsIndex,
    expressionData: uint8ExpressionData,
  });
  const canLoad3DLayers = imageLayerLoaders.some((loader) =>
    Boolean(
      Array.from({
        length: loader.data.length,
      }).filter((_, res) => canLoadResolution(loader.data, res)).length
    )
  );
  // Only show 3D options if we can theoretically load the data and it is allowed to be loaded.
  const canShow3DOptions =
    canLoad3DLayers &&
    !(disable3d?.length === imageLayerLoaders.length) &&
    !globalDisable3d;

  const options = useMemo(() => {
    // Only show button if there is expression or 3D data because only cells data
    // does not have any options (i.e for color encoding, you need to switch to expression data)
    if (canShow3DOptions || hasExpressionData) {
      return (
        <SpatialOptions
          observationsLabel={observationsLabel}
          cellColorEncoding={cellColorEncoding}
          setCellColorEncoding={setCellColorEncoding}
          setSpatialAxisFixed={setSpatialAxisFixed}
          spatialAxisFixed={spatialAxisFixed}
          use3d={use3d}
          tooltipsVisible={tooltipsVisible}
          setTooltipsVisible={setTooltipsVisible}
          geneExpressionColormap={geneExpressionColormap}
          setGeneExpressionColormap={setGeneExpressionColormap}
          geneExpressionColormapRange={geneExpressionColormapRange}
          setGeneExpressionColormapRange={setGeneExpressionColormapRange}
          canShowExpressionOptions={hasExpressionData}
          canShowColorEncodingOption={
            (hasLocationsData || hasSegmentationsData) && hasExpressionData
          }
          canShow3DOptions={canShow3DOptions}
        />
      );
    }
    return null;
  }, [
    canShow3DOptions,
    cellColorEncoding,
    geneExpressionColormap,
    geneExpressionColormapRange,
    setGeneExpressionColormap,
    hasLocationsData,
    hasSegmentationsData,
    hasExpressionData,
    observationsLabel,
    setCellColorEncoding,
    setGeneExpressionColormapRange,
    setSpatialAxisFixed,
    spatialAxisFixed,
    use3d,
    tooltipsVisible,
    setTooltipsVisible,
  ]);

  useEffect(() => {
    // For backwards compatibility (diamond case).
    // Log to the console to alert the user that the auto-generated diamonds are being used.
    if (
      !hasSegmentationsData &&
      cellsLayer &&
      !obsSegmentations &&
      !obsSegmentationsIndex &&
      obsCentroids &&
      obsCentroidsIndex
    ) {
      console.warn(
        "Rendering cell segmentation diamonds for backwards compatibility."
      );
    }
  }, [
    hasSegmentationsData,
    cellsLayer,
    obsSegmentations,
    obsSegmentationsIndex,
    obsCentroids,
    obsCentroidsIndex,
  ]);

  // Without useMemo, this would propagate a change every time the component
  // re - renders as opposed to when it has to.
  const resolutionFilteredImageLayerLoaders = useMemo(() => {
    // eslint-disable-next-line max-len
    const shouldUseFullData = (ll, index) =>
      Array.isArray(useFullResolutionImage) &&
      useFullResolutionImage.includes(meta[index].name) &&
      Array.isArray(ll.data);
    // eslint-disable-next-line max-len
    return imageLayerLoaders.map((ll, index) =>
      shouldUseFullData(ll, index) ? { ...ll, data: ll.data[0] } : ll
    );
  }, [imageLayerLoaders, useFullResolutionImage, meta]);

  const [channelNames, channelColors] = useMemo(() => {
    let names = [];
    let colors = [];

    if (
      imageLayers &&
      imageLayers.length > 0 &&
      imageLayerLoaders &&
      imageLayerLoaders.length > 0
    ) {
      const firstImageLayer = imageLayers[0];
      const firstImageLayerLoader = imageLayerLoaders?.[firstImageLayer?.index];
      if (
        firstImageLayer &&
        !firstImageLayer.colormap &&
        firstImageLayer.channels &&
        firstImageLayerLoader
      ) {
        const allChannels = firstImageLayerLoader.channels;
        // Bioformats-Zarr uses selection.channel but OME-TIFF and OME-Zarr use selection.c
        names = firstImageLayer.channels.map(
          (c) =>
            allChannels[
            c.selection.channel === undefined
              ? c.selection.c
              : c.selection.channel
            ]
        );
        colors = firstImageLayer.channels.map((c) => c.color);
      }
    }

    return [names, colors];
  }, [imageLayers, imageLayerLoaders]);

  return (
    <TitleInfo
      title={title}
      info={subtitle}
      isSpatial
      urls={urls}
      theme={theme}
      closeButtonVisible={closeButtonVisible}
      downloadButtonVisible={downloadButtonVisible}
      removeGridComponent={removeGridComponent}
      isReady={isReady}
      options={options}
    >
      <div
        style={{
          position: "absolute",
          bottom: "5px",
          left: "5px",
          zIndex: 6,
        }}
      >
        {channelNamesVisible && channelNames
          ? channelNames.map((name, i) => (
            <Typography
              variant="h6"
              key={`${name}-${colorArrayToString(channelColors[i])}`}
              style={{
                color: colorArrayToString(channelColors[i]),
                fontSize: "14px",
              }}
            >
              {name}
            </Typography>
          ))
          : null}
      </div>
      <SpatialWrapper
        dataset={dataset}
        ref={deckRef}
        uuid={uuid}
        width={width}
        height={height}
        viewState={{
          zoom,
          target: [targetX, targetY, targetZ],
          rotationX,
          rotationY,
          rotationZ,
          rotationOrbit,
          orbitAxis,
        }}
        setViewState={setViewState}
        originalViewState={originalViewState}
        imageLayerDefs={imageLayers}
        obsSegmentationsLayerDefs={cellsLayer}
        obsLocationsLayerDefs={moleculesLayer}
        neighborhoodLayerDefs={neighborhoodsLayer}
        obsLocationsIndex={obsLocationsIndex}
        obsSegmentationsIndex={obsSegmentationsIndex}
        obsLocations={obsLocations}
        obsLocationsLabels={obsLocationsLabels}
        obsLocationsFeatureIndex={obsLocationsFeatureIndex}
        hasSegmentations={hasSegmentationsData}
        obsSegmentations={obsSegmentations}
        obsSegmentationsType={obsSegmentationsType}
        obsCentroids={obsCentroids}
        obsCentroidsIndex={obsCentroidsIndex}
        cellFilter={cellFilter}
        cellSelection={cellSelection}
        cellSetSelection={cellSetSelection}
        cellHighlight={cellHighlight}
        cellColors={cellColors}
        neighborhoods={neighborhoods}
        imageLayerLoaders={resolutionFilteredImageLayerLoaders}
        setCellFilter={setCellFilter}
        setCellSelection={setCellSelectionProp}
        setCellHighlight={setCellHighlight}
        setHoverInfo={setHoverInfo}
        setMoleculeHighlight={setMoleculeHighlight}
        setComponentHover={() => {
          setComponentHover(uuid);
        }}
        updateViewInfo={setComponentViewInfo}
        imageLayerCallbacks={imageLayerCallbacks}
        segmentationLayerCallbacks={segmentationLayerCallbacks}
        spatialAxisFixed={spatialAxisFixed}
        geneExpressionColormap={geneExpressionColormap}
        geneExpressionColormapRange={geneExpressionColormapRange}
        expressionData={shiftedExpressionDataForBitmask}
        cellColorEncoding={cellColorEncoding}
        getExpressionValue={getExpressionValue}
        theme={theme}
        useFullResolutionImage={useFullResolutionImage}
        reverseLocationsIndex={reverseLocationsIndex}
        additionalCellSets={additionalCellSets}
        setFeatures={setFeatures}
        lockedChannels={lockedChannels}
        rasterLayers={rasterLayers}
        setRasterLayers={setRasterLayers}
        channels={image?.loaders?.[0]?.channels}
        hoverClusterOpacities={hoverClusterOpacities}
        setHoveredCluster={setHoveredCluster}
        showClusterOutlines={showClusterOutlines}
        showClusterTitles={showClusterTitles}
        selectNeighborhood={selectNeighborhood}
        selectedBackground={selectedBackground}
        selectedSelection={selectedSelection}
      />
      {tooltipsVisible && (
        <SpatialTooltipSubscriber
          parentUuid={uuid}
          obsHighlight={cellHighlight}
          width={width}
          height={height}
          getObsInfo={getObsInfo}
          useHoverInfoForTooltip={useHoverInfoForTooltip}
          hoverData={hoverData}
          hoverCoord={hoverCoord}
          getObsIdFromHoverData={getObsIdFromHoverData}
        />
      )}
      <Legend
        visible
        // Fix to dark theme due to black background of spatial plot.
        theme="dark"
        featureType={featureType}
        featureValueType={featureValueType}
        obsColorEncoding={cellColorEncoding}
        featureSelection={geneSelection}
        featureLabelsMap={featureLabelsMap}
        featureValueColormap={geneExpressionColormap}
        featureValueColormapRange={geneExpressionColormapRange}
        extent={expressionExtents?.[0]}
      />
    </TitleInfo>
  );
}
