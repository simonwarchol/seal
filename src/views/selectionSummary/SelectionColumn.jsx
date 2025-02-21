import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';

import { Typography } from '@material-ui/core';
import ScatterPlot from './ScatterPlot';
import FeatureHeatmap from './FeatureHeatmap';

import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';

import NeighborhoodIcon from "../../public/NeighborhoodIcon.svg";

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
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Add your neighborhood icon click handler here
                            }}
                            style={{
                                padding: 4,
                                position: 'relative',
                                visibility: compareMode ? 'hidden' : 'visible'
                            }}
                        >
                            <img
                                src={NeighborhoodIcon}
                                alt="Neighborhood"
                                style={{
                                    width: 16,
                                    height: 16,
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

export default SelectionColumn;