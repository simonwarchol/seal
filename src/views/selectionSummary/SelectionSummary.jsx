import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';

import { treeFindNodeByNamePath, mergeObsSets } from '@vitessce/sets-utils';
import { Card, CardContent, Typography, Tabs, Tab } from '@material-ui/core';
import useStore from "../../store";
import StickyHeader from './StickyHeader';
import * as d3 from 'd3';
import SetOperationIcon from './SetOperationIcon';
import { iconConfigs } from './SetOperationIcon';
import { LayerControllerMemoized } from '../controller/LayerControllerSubscriber';
import { DEFAULT_RASTER_LAYER_PROPS } from "@vitessce/spatial-utils";
import SelectionColumn from './SelectionColumn';
import '../../index.css';

const OPERATION_NAMES = {
    'a_minus_intersection': 'Only in first set',
    'b_minus_intersection': 'Only in second set',
    'intersection': 'Intersection',
    'a_plus_b_minus_intersection': 'Symmetric diff.',
    'a_plus_b': 'Union',
    'complement': 'Complement'
};

const OPERATION_ORDER = [
    'a_minus_intersection',
    'b_minus_intersection',
    'intersection',
    'a_plus_b_minus_intersection',
    'a_plus_b',
    'complement'
];

function SelectionSummary({ selections = [], cellSets, setCellSetSelection, rasterLayers, setRasterLayers, cellsLayer, setCellsLayer, imageLayerLoaders, imageLayerMeta, isReady, imageLayerCallbacks, setImageLayerCallbacks, areLoadingImageChannels, setAreLoadingImageChannels, handleRasterLayerChange, handleRasterLayerRemove, handleSegmentationLayerChange, handleSegmentationLayerRemove, layerControllerRef, moleculesLayer, setMoleculesLayer, closeButtonVisible, downloadButtonVisible, removeGridComponent, theme, title, disable3d, globalDisable3d, disableChannelsIfRgbDetected, enableLayerButtonsWithOneLayer, dataset, obsType, segmentationLayerLoaders, segmentationLayerMeta, segmentationLayerCallbacks, setSegmentationLayerCallbacks, areLoadingSegmentationChannels, setAreLoadingSegmentationChannels, componentHeight, componentWidth, spatialLayout, layerIs3DIndex, setZoom, setTargetX, setTargetY, setTargetZ, setRotationX, setRotationOrbit, obsSegmentationsType, additionalObsSets }) {
    // Move all useStore calls to the top of the component
    const setFeatures = useStore((state) => state.setFeatures);
    const compareMode = useStore((state) => state.compareMode);
    const settingsPanelOpen = useStore((state) => state.settingsPanelOpen);
    const importanceInColor = useStore((state) => state.importanceInColor);
    const setImportanceInColor = useStore((state) => state.setImportanceInColor);
    const viewMode = useStore((state) => state.viewMode);
    const scrollContainerRef = useRef(null);
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
    const [compareSelections, setCompareSelections] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [isCompareModeActive, setIsCompareModeActive] = useState(false);

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
        console.log('setFeatures', setFeatures);

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
    console.log('sortedSelections', sortedSelections);
    // Handle visibility toggle
    const handleVisibilityToggle = (selectionPath, hideOthers = false) => {
        const isVisible = isSelectionVisible(selectionPath);
        if (hideOthers) {
            setCellSetSelection([selectionPath]);
        } else {
            if (isVisible) {
                // Remove from selection
                setCellSetSelection(selections.filter(sel =>
                    !(sel[0] === selectionPath[0] && sel[1] === selectionPath[1])
                ));
            } else {
                setCellSetSelection([...selections, selectionPath]);
            }
        }
    };




    const [comparisonResults, setComparisonResults] = useState(null);

    useEffect(() => {
        console.log('comparisonResults', comparisonResults);
    }, [comparisonResults]);

    // Fetch comparison results when selections change
    useEffect(() => {
        if (!compareSelections || compareSelections.length !== 2 || !cellSets) return;

        const set1 = treeFindNodeByNamePath(cellSets, compareSelections[0].path);
        const set2 = treeFindNodeByNamePath(cellSets, compareSelections[1].path);

        if (!set1 || !set2) return;

        let mounted = true;

        const fetchComparisonResults = async () => {
            try {
                const response = await fetch(`${import.meta.env.BASE_URL}/set-compare`, {
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

    // Clear comparison results and selections when exiting compare mode
    useEffect(() => {
        if (!compareMode) {
            setComparisonResults(null);
            setCompareSelections([]); // Clear the compare selections
        }
    }, [compareMode]);

    const handleRowClick = (selection) => {
        if (!compareMode) return;

        setCompareSelections(prev => {
            const alreadySelected = prev.find(s => s.path[0] === selection.path[0] && s.path[1] === selection.path[1]);

            if (alreadySelected) {
                // If clicking an already selected row, remove it
                const newSelections = prev.filter(s => !(s.path[0] === selection.path[0] && s.path[1] === selection.path[1]));
                setIsCompareModeActive(newSelections.length === 2); // Check if exactly 2 are selected
                return newSelections;
            } else {
                // Add the new selection
                const newSelections = [...prev, selection];
                setIsCompareModeActive(newSelections.length === 2); // Check if exactly 2 are selected
                return newSelections;
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
        if (compareMode && compareSelections.length < 2) return () => "#000000"; // 
        const sortedFeatures = [...setFeatures[selections?.[0]?.[0]]?.[selections?.[0]?.[1]]?.feat_imp].sort((a, b) => a[0].localeCompare(b[0]));
        return d3.scaleSequential()
            .domain([0, d3.max(sortedFeatures, d => d[1])])
            .interpolator(d3.interpolateViridis);
    }, [setFeatures, selections, compareMode, compareSelections]);

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
                transform: `translateX(${settingsPanelOpen ? '0' : '-500px'})`,
                transition: 'transform 0.3s ease-in-out',
                zIndex: 999,
                borderRight: '1px solid #333333',
            }}>

                <div style={{ padding: '0', color: '#ffffff', margin: 0 }}>
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
                        componentHeight={componentHeight}
                        componentWidth={componentWidth}
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
                marginLeft: settingsPanelOpen ? '300px' : '0',
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
                        height: '100%', // Set height to 100% to occupy the full height of the parent

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
                            <div className="selection-row">
                                {sortedSelections?.filter(selection =>
                                    compareSelections.some(s =>
                                        s.path[0] === selection.path[0] && s.path[1] === selection.path[1]
                                    )
                                ).map((selection, i) => (
                                    <SelectionColumn
                                        key={`selected-${i}`}
                                        selection={selection}
                                        setFeature={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
                                        viewMode={viewMode}
                                        PLOT_SIZE={PLOT_SIZE}
                                        heatmapContainerWidth={heatmapContainerWidth}
                                        heatmapContainerRef={heatmapContainerRef}
                                        isVisible={isSelectionVisible(selection.path)}
                                        onVisibilityToggle={(hideOthers) => handleVisibilityToggle(selection.path, hideOthers)}
                                        onClick={() => handleRowClick(selection)}
                                        titleColor={selection.color}
                                        compareMode={compareMode}
                                        importanceColorScale={importanceColorScale}
                                        occuranceColorScale={occuranceColorScale}
                                        importanceInColor={importanceInColor}
                                        setImportanceInColor={setImportanceInColor}
                                        backgroundColor="#2C3E50"
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
                                    justifyContent: 'space-evenly',
                                    alignItems: 'center',
                                    marginLeft: '2px',
                                    marginRight: '2px',
                                    height: '100%',
                                    width: `${PLOT_SIZE}px`,
                                    flexShrink: 0
                                }}>
                                    {OPERATION_ORDER.map((operation) => (
                                        <div style={{
                                            width: '100%',
                                            height: `${100 / OPERATION_ORDER.length - 2}%`, // Distribute height evenly
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            padding: '2px'
                                        }}>
                                            <SetOperationIcon
                                                key={operation}
                                                type={operation}
                                                size="100%"
                                                disabled={!comparisonResults?.operations?.[operation]}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Derived sets from comparison */}
                            {compareMode && isCompareModeActive && comparisonResults?.operations && (
                                <div className="selection-row" style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: '2px',
                                    flexShrink: 0
                                }}>
                                    {Object.entries(comparisonResults.operations)
                                        .filter(([_, value]) => value.count > 0)
                                        .map(([operation, value], i) => (
                                            <Card
                                                key={`comparison-${i}`}
                                                variant="outlined"
                                                style={{
                                                    backgroundColor: '#1A1A1A',
                                                    borderColor: '#333333',
                                                    padding: 1,
                                                    marginRight: '2px',
                                                    display: 'inline-block',
                                                    height: '100%',
                                                    width: `${PLOT_SIZE * 2}px`,
                                                    flex: '0 0 auto',
                                                }}
                                            >
                                                <SelectionColumn
                                                    key={`comparison-${i}`}
                                                    selection={{
                                                        path: [`${OPERATION_NAMES[operation]}`, ``]
                                                    }}
                                                    setFeature={comparisonResults?.operations[operation].data}
                                                    viewMode={viewMode}
                                                    PLOT_SIZE={PLOT_SIZE}
                                                    heatmapContainerWidth={PLOT_SIZE * 2}
                                                    heatmapContainerRef={heatmapContainerRef}
                                                    isVisible={true}
                                                    onVisibilityToggle={() => { }}
                                                    onClick={() => { }}
                                                    titleColor={operation === 'complement' ? '#e6ab03' : iconConfigs[operation]?.color}
                                                    compareMode={compareMode}
                                                    importanceColorScale={importanceColorScale}
                                                    occuranceColorScale={occuranceColorScale}
                                                    importanceInColor={importanceInColor}
                                                    setImportanceInColor={setImportanceInColor}
                                                    backgroundColor={operation === 'complement' ? `${iconConfigs[operation]?.background}99` : `${iconConfigs[operation]?.color}99`}
                                                />
                                            </Card>
                                        ))}
                                </div>
                            )}

                            {/* Unselected sets */}
                            <div className="selection-row">
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
                                        <SelectionColumn
                                            selection={selection}
                                            setFeature={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
                                            viewMode={viewMode}
                                            PLOT_SIZE={PLOT_SIZE}
                                            heatmapContainerWidth={heatmapContainerWidth}
                                            heatmapContainerRef={heatmapContainerRef}
                                            isVisible={isSelectionVisible(selection.path)}
                                            onVisibilityToggle={(hideOthers) => handleVisibilityToggle(selection.path, hideOthers)}
                                            onClick={() => handleRowClick(selection)}
                                            titleColor={selection.color}
                                            compareMode={compareMode}
                                            importanceColorScale={importanceColorScale}
                                            occuranceColorScale={occuranceColorScale}
                                            importanceInColor={importanceInColor}
                                            setImportanceInColor={setImportanceInColor} />
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Regular view (not compare mode)
                        sortedSelections?.map((selection, i) => (
                            <SelectionColumn
                                key={i}
                                selection={selection}
                                setFeature={setFeatures[selection?.path?.[0]]?.[selection?.path?.[1]]}
                                viewMode={viewMode}
                                PLOT_SIZE={PLOT_SIZE}
                                heatmapContainerWidth={heatmapContainerWidth}
                                heatmapContainerRef={heatmapContainerRef}
                                isVisible={isSelectionVisible(selection.path)}
                                onVisibilityToggle={(hideOthers) => handleVisibilityToggle(selection.path, hideOthers)}
                                onClick={() => handleRowClick(selection)}
                                titleColor={selection.color}
                                compareMode={compareMode}
                                importanceColorScale={importanceColorScale}
                                occuranceColorScale={occuranceColorScale}
                                importanceInColor={importanceInColor}
                                setImportanceInColor={setImportanceInColor}
                                backgroundColor={isSelectionVisible(selection.path) ? '#1A1A1A' : '#121212'}
                                opacity={isSelectionVisible(selection.path) ? 1 : 0.5}
                            />
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}

export default SelectionSummary;