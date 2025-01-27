import React, { useState } from 'react';
import { SetIntersectionSVG } from '@vitessce/icons';
import { Icon, Grid, Typography, ToggleButton, Select, MenuItem } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grow from '@mui/material/Grow';
import './LayerOverlays.css';
import useStore from '../../store';
import InfoLayer from "../../public/InfoLayer.svg";
import { BorderOuter as BorderOuterIcon } from '@material-ui/icons';
import { Title as TitleIcon } from '@material-ui/icons';
import { GroupWork as GroupWorkIcon } from '@material-ui/icons';

function LayerOverlays() {
    const [checked, setChecked] = useState(false);
    const showClusterOutlines = useStore((state) => state.showClusterOutlines);
    const showClusterTitles = useStore((state) => state.showClusterTitles);
    const setShowClusterOutlines = useStore((state) => state.setShowClusterOutlines);
    const setShowClusterTitles = useStore((state) => state.setShowClusterTitles);
    const featureCount = useStore((state) => state.featureCount);
    const setFeatureCount = useStore((state) => state.setFeatureCount);

    const handleFeatureCountChange = (event) => {
        setFeatureCount(event.target.value);
    };

    return (
        <>
            <Box sx={{
                display: 'flex',
                width: '100%',
                pointerEvents: checked ? 'auto' : 'none'
            }}>
                <Grow in={checked}>
                    <Paper
                        className={'layerOverlayPaper'}
                        elevation={4}
                        sx={{
                            position: 'absolute',
                            margin: 0,
                            padding: '10px',
                            width: '200px',
                            height: 'auto',
                            right: '30px',
                            top: '20px'
                        }}
                    >
                        <Grid container direction="column" spacing={1}>
                            <Grid item>
                                <Grid container alignItems="center">
                                    <Grid item xs={3} container justifyContent="center">
                                        <BorderOuterIcon
                                            onClick={() => setShowClusterOutlines(!showClusterOutlines)}
                                            color={showClusterOutlines ? 'primary' : 'inherit'}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </Grid>
                                    <Grid item xs={9} style={{ padding: 0, margin: 0 }}>
                                        <Typography variant="body2" align="left" style={{ padding: 0, margin: 0 }}>
                                            Outline Clusters
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item>
                                <Grid container alignItems="center">
                                    <Grid item xs={3} container justifyContent="center">
                                        <TitleIcon
                                            onClick={() => setShowClusterTitles(!showClusterTitles)}
                                            color={showClusterTitles ? 'primary' : 'inherit'}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </Grid>
                                    <Grid item xs={9} style={{ padding: 0, margin: 0 }}>
                                        <Typography variant="body2" align="left" style={{ padding: 0, margin: 0 }}>
                                            Show Titles
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item>
                                <Grid container alignItems="center">
                                    <Grid item xs={2} />
                                    <Grid item xs={8}>
                                        <Select
                                            value={featureCount}
                                            onChange={handleFeatureCountChange}
                                            size="small"
                                            sx={{
                                                minWidth: '100px',
                                                height: '30px'
                                            }}
                                        >
                                            {[0, 1, 2, 3, 4, 5].map((num) => (
                                                <MenuItem key={num} value={num}>
                                                    {num} Features
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grow>
            </Box>

            <div
                className={checked ? 'layerOverlayIcon selectedLayerOverlay' : 'layerOverlayIcon unselectedLayerOverlay'}
                style={{
                    pointerEvents: 'auto'
                }}
            >
                <Icon style={{ width: '30px', height: '30px', cursor: 'pointer', }} onClick={() => { setChecked(!checked); }}>
                    <img style={{
                        fill: checked ? 'blue' : 'grey'
                    }} src={InfoLayer} alt="Info Layer" />
                </Icon>
            </div>
        </>
    );
}

export default LayerOverlays;