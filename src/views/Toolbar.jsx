import "./Toolbar.css";
import React, { useState } from "react";
import sealLogo from "../public/SealLogo.svg";
import SettingsIcon from '@mui/icons-material/Settings';
import ConstructionIcon from '@mui/icons-material/Construction';
import { Menu, MenuItem, Grid, Box, Select } from '@mui/material';
import { BorderOuter as BorderOuterIcon } from '@material-ui/icons';
import { Title as TitleIcon } from '@material-ui/icons';
import { CompareArrows as CompareArrowsIcon } from '@mui/icons-material';
import useStore from '../store';

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
                alignItems="flex-end"
                justifyContent="flex-start"
                spacing={1}
                style={{ width: '400px' }}
            >
                <Grid item>
                    <img src={sealLogo} />
                </Grid>
                <Grid item>
                    <span className="seal-text">SEAL</span>
                </Grid>
                <Box
                    onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
                >
                    <Grid container alignItems="center" sx={{ cursor: 'pointer' }}>
                        <Grid item m={0.5}>
                            <ConstructionIcon className="settings-icon" />
                        </Grid>
                        <Grid item m={0.5}>
                            <span className="seal-text tools">TOOLS</span>
                        </Grid>
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
                                    <CompareArrowsIcon
                                        color={compareMode ? 'primary' : 'inherit'}
                                    />
                                </Grid>
                                <Grid item>
                                    <span>Compare Mode</span>
                                </Grid>
                            </Grid>
                        </MenuItem>
                        <MenuItem onClick={() => setShowClusterOutlines(!showClusterOutlines)}>
                            <Grid container alignItems="center" spacing={2}>
                                <Grid item>
                                    <BorderOuterIcon
                                        color={showClusterOutlines ? 'primary' : 'inherit'}
                                    />
                                </Grid>
                                <Grid item>
                                    <span>Outline Clusters</span>
                                </Grid>
                            </Grid>
                        </MenuItem>
                        <MenuItem onClick={() => setShowClusterTitles(!showClusterTitles)}>
                            <Grid container alignItems="center" spacing={2}>
                                <Grid item>
                                    <TitleIcon
                                        color={showClusterTitles ? 'primary' : 'inherit'}
                                    />
                                </Grid>
                                <Grid item>
                                    <span>Show Titles</span>
                                </Grid>
                            </Grid>
                        </MenuItem>
                        <MenuItem sx={{ 
                            pointerEvents: 'none',
                            '&:hover': {
                                backgroundColor: 'transparent'
                            }
                        }}>
                            <Grid container alignItems="center" spacing={1} sx={{ width: '100%', p: 1 }}>
                                <Grid item xs={6}>
                                    <span>Features</span>
                                    <Select
                                        value={featureCount}
                                        onChange={handleFeatureCountChange}
                                        size="small"
                                        fullWidth
                                        sx={{
                                            height: '30px',
                                            pointerEvents: 'auto'
                                        }}
                                    >
                                        {[0, 1, 2, 3, 4, 5].map((num) => (
                                            <MenuItem key={num} value={num}>
                                                {num}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                                <Grid item xs={6}>
                                    <span>Font Size</span>
                                    <Select
                                        value={titleFontSize}
                                        onChange={handleTitleFontSizeChange}
                                        size="small"
                                        fullWidth
                                        sx={{
                                            height: '30px',
                                            pointerEvents: 'auto'
                                        }}
                                    >
                                        {[8, 10, 12, 14, 16, 18, 20].map((size) => (
                                            <MenuItem key={size} value={size}>
                                                {size}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                            </Grid>
                        </MenuItem>
                    </Menu>
                </Box>
            </Grid>
        </div>
    );
};

export default Toolbar;