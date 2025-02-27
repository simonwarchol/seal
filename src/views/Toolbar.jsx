import "./Toolbar.css";
import React, { useState } from "react";
import sealLogo from "../public/SealLogo.svg";
import { Icon } from '@material-ui/core';

import SettingsIcon from '@mui/icons-material/Settings';
import ConstructionIcon from '@mui/icons-material/Construction';
import { Menu, MenuItem, Grid, Box, Select } from '@mui/material';
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
    const viewMode = useStore((state) => state.viewMode);
    const setViewMode = useStore((state) => state.setViewMode);

    const handleFeatureCountChange = (event) => {
        setFeatureCount(event.target.value);
    };

    const handleTitleFontSizeChange = (event) => {
        setTitleFontSize(event.target.value);
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
                    <span className="seal-text">SEAL</span>
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
                    <MenuItem onClick={() => setCompareMode(!compareMode)}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item>
                                <CompareArrowsIcon color={compareMode ? 'primary' : 'inherit'} />
                            </Grid>
                            <Grid item>
                                <span>Compare Mode</span>
                            </Grid>
                        </Grid>
                    </MenuItem>
                    <MenuItem onClick={() => setShowClusterOutlines(!showClusterOutlines)}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item>
                                <BorderOuterIcon color={showClusterOutlines ? 'primary' : 'inherit'} />
                            </Grid>
                            <Grid item>
                                <span>Outline Clusters</span>
                            </Grid>
                        </Grid>
                    </MenuItem>
                    <MenuItem onClick={() => setShowClusterTitles(!showClusterTitles)}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item>
                                <TitleIcon color={showClusterTitles ? 'primary' : 'inherit'} />
                            </Grid>
                            <Grid item>
                                <span>Show Titles</span>
                            </Grid>
                        </Grid>
                    </MenuItem>
                    <MenuItem onClick={() => setNeighborhoodPointerMode(!neighborhoodPointerMode)}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item>
                                <Icon style={{ textAlign: 'center' }}>
                                    <img 
                                        src={housePointer} 
                                        style={{ height: 24, width: 24 }}
                                        alt="Neighborhood pointer"
                                    />
                                </Icon>
                            </Grid>
                            <Grid item>
                                <span>Neighborhood Pointer</span>
                            </Grid>
                        </Grid>
                    </MenuItem>setViewMode
                    <MenuItem onClick={() => (viewMode === 'embedding' ? 'spatial' : 'embedding')}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item>
                                <Icon style={{ textAlign: 'center' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 3h18v18H3V3m1 1v16h16V4H4z"/>
                                        <path d="M12 8l-4 4 4 4 4-4z"/>
                                    </svg>
                                </Icon>
                            </Grid>
                            <Grid item>
                                <span>{viewMode === 'embedding' ? 'Switch to Image' : 'Switch to Embedding'}</span>
                            </Grid>
                        </Grid>
                    </MenuItem>
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
                    
                </Menu>
            </Grid>
        </div>
    );
};

export default Toolbar;