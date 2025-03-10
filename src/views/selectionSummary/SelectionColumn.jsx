import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Typography, Card, CardContent } from '@material-ui/core';
import ScatterPlot from './ScatterPlot';
import FeatureHeatmap from './FeatureHeatmap';
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import NeighborhoodIcon from "../../public/NeighborhoodIcon.svg";
import useStore from '../../store';

function SelectionColumn(props) {
    console.log('props', props)
    const [showNeighborhood, setShowNeighborhood] = useState(false);
    const [neighborhoodData, setNeighborhoodData] = useState(null);
    const maxSelectionSize = useStore((state) => state.maxSelectionSize);
    const setMaxSelectionSize = useStore((state) => state.setMaxSelectionSize);

    useEffect(() => {
        const getNeighborhoodData = async () => {
            try {
                if (!props?.setFeature?.selection_ids || !props.selection?.path) return;

                const response = await fetch('http://localhost:8181/neighborhood', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: props.selection.path[0] + ' Neighbors',
                        path: props.selection.path,
                        set: props?.setFeature?.selection_ids?.map(id => [id])

                    })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                console.log('data', data)
                setNeighborhoodData(data.data);
            } catch (error) {
                console.error('Error fetching neighborhood data:', error);
                setNeighborhoodData(null);
            }
        };

        if (showNeighborhood && !neighborhoodData) {
            getNeighborhoodData();
        }
    }, [showNeighborhood, props.setFeature, props.selection]);


    // Add useEffect to handle maxSelectionSize updates
    useEffect(() => {
        const currentSelectionSize = props.setFeature?.selection_ids?.length;
        if (currentSelectionSize && currentSelectionSize > maxSelectionSize) {
            setMaxSelectionSize(currentSelectionSize);
        }
    }, [props.setFeature?.selection_ids?.length, maxSelectionSize]);


    return (
        <>
            <SelectionColumnChild {...props} showNeighborhood={showNeighborhood} setShowNeighborhood={setShowNeighborhood} />
            {showNeighborhood && neighborhoodData &&
                <SelectionColumnChild
                    {...props}
                    backgroundColor={'#040'}
                    isNeighborhood={true}
                    setFeature={{
                        selection_ids: neighborhoodData.selection_ids,
                        embedding_coordinates: neighborhoodData.embedding_coordinates,
                        spatial_coordinates: neighborhoodData.spatial_coordinates,
                        feat_imp: neighborhoodData.feat_imp,
                        summary: neighborhoodData.summary,
                        hulls: neighborhoodData.hulls,
                        normalized_occurrence: neighborhoodData.normalized_occurrence,
                        selection_mean_features: neighborhoodData.selection_mean_features,
                        selection_ids: neighborhoodData.selection_ids,
                        global_mean_features: neighborhoodData.global_mean_features

                    }}
                />
            }
        </>
    );
}

function SelectionColumnChild({
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
    titleColor,
    compareMode,
    importanceColorScale,
    occuranceColorScale,
    importanceInColor,
    setImportanceInColor,
    backgroundColor,
    opacity = 1,
    borderColor = '#333333',
    showNeighborhood = false,
    setShowNeighborhood = () => { },
    isNeighborhood = false
}) {
    const columnRef = useRef(null);
    const [columnWidth, setColumnWidth] = useState(PLOT_SIZE * 2);

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

        updateWidth();

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const plotWidth = columnWidth - 4;

    return (
        <>
            <Card
                variant="outlined"
                style={{
                    backgroundColor,
                    borderColor,
                    padding: 1,
                    marginRight: '2px',
                    display: 'inline-block',
                    height: '100%',
                    width: 'auto',
                    flex: '1 0 auto',
                    minWidth: `${PLOT_SIZE * 2}px`,
                    maxWidth: `${PLOT_SIZE * 2}px`,
                    opacity,
                    ...style
                }}
            >
                <CardContent style={{
                    padding: 0,
                    height: '100%',
                    width: '100%',
                }}>
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
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '20px', maxHeight: '20px', minHeight: '20px' }}>
                                <Typography variant="subtitle2" style={{ color: '#ffffff', fontSize: '0.8rem' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onVisibilityToggle(true);
                                    }}
                                >
                                    {isNeighborhood ? '← Neighbors    ' : (
                                        <>
                                            <span style={{ color: titleColor }}>
                                                {selection?.path?.[0]}
                                            </span>
                                            {'-'}
                                            <span>{selection?.path?.[1]}</span>
                                        </>
                                    )}
                                </Typography>
                                {!isNeighborhood &&
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowNeighborhood(!showNeighborhood);
                                            }}
                                            style={{
                                                padding: 0,
                                                margin: 0,
                                                visibility: compareMode ? 'hidden' : 'visible'
                                            }}
                                        >
                                            <img
                                                src={NeighborhoodIcon}
                                                alt="Neighborhood"
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    filter: showNeighborhood ? 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(40%) contrast(119%)' : 'none'
                                                }}
                                            />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onVisibilityToggle();
                                            }}
                                            style={{
                                                padding: 0,
                                                margin: 0,
                                                visibility: compareMode ? 'hidden' : 'visible'
                                            }}
                                        >
                                            {isVisible ? (
                                                <VisibilityOutlined style={{ fontSize: 20, color: '#ffffff' }} />
                                            ) : (
                                                <VisibilityOffOutlined style={{ fontSize: 20, color: '#666666' }} />
                                            )}
                                        </IconButton>
                                    </div>
                                }
                            </div>
                            {setFeature?.feat_imp && (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div style={{ height: `${PLOT_SIZE}px`, padding: 0, margin: 0, lineHeight: 0 }}>
                                        <ScatterPlot
                                            data={viewMode === 'embedding'
                                                ? setFeature?.embedding_coordinates
                                                : setFeature?.spatial_coordinates}
                                            backgroundData={viewMode === 'embedding'
                                                ? setFeature?.summary.embedding_subsample
                                                : setFeature?.summary.spatial_subsample}
                                            selectionIds={setFeature?.selection_ids}
                                            ranges={[
                                                [setFeature?.summary[`${viewMode}_ranges`][0][0], setFeature?.summary[`${viewMode}_ranges`][0][1]],
                                                [setFeature?.summary[`${viewMode}_ranges`][1][0], setFeature?.summary[`${viewMode}_ranges`][1][1]]
                                            ]}
                                            height={PLOT_SIZE}
                                            width={plotWidth}
                                            title={viewMode === 'embedding' ? 'Embedding' : 'Spatial'}
                                            selectionSize={setFeature?.selection_ids?.length}
                                        />
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
                </CardContent>
            </Card>
        </>
    );
}

export default SelectionColumn;