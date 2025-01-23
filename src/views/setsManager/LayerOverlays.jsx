import React, { useState } from 'react';
import { SetIntersectionSVG } from '@vitessce/icons';
import { Icon, Grid, Typography, ToggleButton } from '@mui/material';
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
    const [featureCount, setFeatureCount] = useState(3);

    const handleFeatureCountChange = (count) => {
        setFeatureCount(count);
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
                        className={'vennPaper'}
                        elevation={4}
                        sx={{
                            margin: 0,
                            padding: '10px',
                            width: '200px',
                            height: 'auto',
                            position: 'absolute',
                            right: '35px',
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
                                    <Grid item xs={3} container justifyContent="center">
                                        <GroupWorkIcon
                                            style={{ cursor: 'pointer' }}
                                            color={featureCount > 0 ? 'primary' : 'inherit'}
                                        />
                                    </Grid>
                                    <Grid item xs={9}>
                                        <Grid container spacing={1}>
                                            {[1, 2, 3].map((num) => (
                                                <Grid item key={num}>
                                                    <ToggleButton
                                                        value={num}
                                                        selected={featureCount === num}
                                                        onClick={() => handleFeatureCountChange(num)}
                                                        size="small"
                                                        sx={{
                                                            padding: '2px 6px',
                                                            minWidth: 0
                                                        }}
                                                    >
                                                        {num}
                                                    </ToggleButton>
                                                </Grid>
                                            ))}
                                        </Grid>
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