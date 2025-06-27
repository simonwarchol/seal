import "./Toolbar.css";
import React, { useState } from "react";
import sealLogo from "../public/SealLogo.svg";
import { Icon } from '@material-ui/core';

import SettingsIcon from '@mui/icons-material/Settings';
import ConstructionIcon from '@mui/icons-material/Construction';
import { Menu, MenuItem, Grid, Box, Select, ToggleButtonGroup, ToggleButton, Slider, Typography, Divider } from '@mui/material';
import { BorderOuter as BorderOuterIcon } from '@material-ui/icons';
import { Title as TitleIcon } from '@material-ui/icons';
import { CompareArrows as CompareArrowsIcon } from '@mui/icons-material';
import useStore from '../store';
import housePointer from "../public/housePointer.svg";

const Toolbar = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const showClusterOutlines = useStore((state) => state.showClusterOutlines);
    const showClusterTitles = useStore((state) => state.showClusterTitles);
    const setShowClusterOutlines = useStore((state) => state.setShowClusterOutlines);
    const setShowClusterTitles = useStore((state) => state.setShowClusterTitles);
    const featureCount = useStore((state) => state.featureCount);
    const setFeatureCount = useStore((state) => state.setFeatureCount);
    const titleFontSize = useStore((state) => state.titleFontSize);
    const setTitleFontSize = useStore((state) => state.setTitleFontSize);
    const compareMode = useStore((state) => state.compareMode);
    const setCompareMode = useStore((state) => state.setCompareMode);
    const neighborhoodPointerMode = useStore((state) => state.neighborhoodPointerMode);
    const setNeighborhoodPointerMode = useStore((state) => state.setNeighborhoodPointerMode);
    const neighborhoodMode = useStore((state) => state.neighborhoodMode);
    const setNeighborhoodMode = useStore((state) => state.setNeighborhoodMode);
    const neighborhoodKnn = useStore((state) => state.neighborhoodKnn);
    const setNeighborhoodKnn = useStore((state) => state.setNeighborhoodKnn);
    const neighborhoodRadius = useStore((state) => state.neighborhoodRadius);
    const setNeighborhoodRadius = useStore((state) => state.setNeighborhoodRadius);

    const handleFeatureCountChange = (event) => {
        setFeatureCount(event.target.value);
    };

    const handleTitleFontSizeChange = (event) => {
        setTitleFontSize(event.target.value);
    };

    const handleNeighborhoodModeChange = (event, newMode) => {
        if (newMode !== null) {
            setNeighborhoodMode(newMode);
        }
    };

    return (
        <div id="toolbar">
            <Grid
                container
                direction="row"
                alignItems="center"
                justifyContent="flex-start"
                spacing={1}
                style={{ width: '400px' }}
            >
                <Grid item xs={'auto'}>
                    <img src={sealLogo} />
                </Grid>
                <Grid item style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2em', fontFamily: 'Nunito, sans-serif', color: '#FFFFFF' }} className="seal-text">SEAL</span>
                    <Box ml={1}>
                        <ConstructionIcon 
                            className="settings-icon" 
                            sx={{ fontSize: '1.2em' }} 
                            onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
                        />
                    </Box>
                </Grid>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    onClick={(e) => e.stopPropagation()}
                    MenuListProps={{
                        onMouseLeave: () => setAnchorEl(null)
                    }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    PaperProps={{
                        style: {
                            width: '250px',
                        },
                    }}
                >
                    <MenuItem>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={6}>
                                <span>Features</span>
                            </Grid>
                            <Grid item xs={6}>
                                <Select
                                    value={featureCount}
                                    onChange={handleFeatureCountChange}
                                    size="small"
                                    sx={{ height: '30px' }}
                                >
                                    {[0, 1, 2, 3, 4, 5].map((num) => (
                                        <MenuItem key={num} value={num}>{num}</MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                        </Grid>
                    </MenuItem>
                    <MenuItem>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={6}>
                                <span>Font Size</span>
                            </Grid>
                            <Grid item xs={6}>
                                <Select
                                    value={titleFontSize}
                                    onChange={handleTitleFontSizeChange}
                                    size="small"
                                    sx={{ height: '30px' }}
                                >
                                    {[8, 10, 12, 14, 16, 18, 20].map((size) => (
                                        <MenuItem key={size} value={size}>{size}</MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                        </Grid>
                    </MenuItem>
                    <Divider />
                    <MenuItem>
                        <Grid container direction="column" spacing={1}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Neighborhood Settings</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <ToggleButtonGroup
                                    value={neighborhoodMode}
                                    exclusive
                                    onChange={handleNeighborhoodModeChange}
                                    className="neighborhood-toggle-group"
                                    size="small"
                                    fullWidth
                                >
                                    <ToggleButton value="knn">KNN</ToggleButton>
                                    <ToggleButton value="distance">Distance</ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>
                            {neighborhoodMode === 'knn' ? (
                                <Grid item container alignItems="center" spacing={1}>
                                    <Grid item xs={8}>
                                        <span>Neighbors</span>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Select
                                            value={neighborhoodKnn}
                                            onChange={(e) => setNeighborhoodKnn(e.target.value)}
                                            size="small"
                                            className="neighborhood-select"
                                        >
                                            {[5, 10, 15, 20, 25, 30].map((n) => (
                                                <MenuItem key={n} value={n}>{n}</MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Grid item container alignItems="center" spacing={1}>
                                    <Grid item xs={8}>
                                        <span>Radius (pixels)</span>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Select
                                            value={neighborhoodRadius}
                                            onChange={(e) => setNeighborhoodRadius(e.target.value)}
                                            size="small"
                                            className="neighborhood-select"
                                        >
                                            {[10, 25, 50, 75, 100, 150, 200].map((n) => (
                                                <MenuItem key={n} value={n}>{n}</MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </MenuItem>
                </Menu>
            </Grid>
        </div>
    );
};

export default Toolbar;