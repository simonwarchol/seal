import React, {
    useState, useRef
} from "react";
import clsx from "clsx";

import { BorderOuter as BorderOuterIcon } from '@material-ui/icons';
import { Title as TitleIcon } from '@material-ui/icons';
import { Label as LabelIcon } from '@material-ui/icons';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import OutlineClusterIcon from "../../public/OutlineCluster.svg";
import LabelClusterIcon from "../../public/LabelCluster.svg";
import Icon from '@mui/material/Icon';
import TextFieldsOutlinedIcon from '@mui/icons-material/TextFieldsOutlined';
import showBackground from "../../public/ShowBackground.svg";
import hideBackground from "../../public/HideBackground.svg";
import CellBackground from "../../public/CellBackground.svg";
import SpotlightSelectionIcon from "../../public/SpotlightSelection.svg";
import DoNotSpotlightSelectionIcon from "../../public/DoNotSpotlightSelection.svg";
import OutlineSelectionIcon from "../../public/OutlineSelection.svg";
import DoNotOutlineSelectionIcon from "../../public/DoNotOutlineSelection.svg";
import ContoursIcon from "../../public/ContourIcon.svg";
import ChannelSettingsIcon from "../../public/ChannelSettings.svg";
import BackgroundIcon from "../../public/BackgroundColor.svg";
import DotsOnIcon from "../../public/DotsOn.svg";
import {

    Menu,
    MenuItem,
    Select,
    Grid,
} from "@material-ui/core";
import {

    SELECTION_TYPE,
} from "@vitessce/gl";


import { PointerIconSVG, SelectLassoIconSVG } from "@vitessce/icons";
import { CenterFocusStrong, ErrorSharp, Layers } from "@material-ui/icons";
import useStore from "../../store";




function ToolMenu(props) {
    const { dataset } = props;
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
    const viewMode = useStore((state) => state.viewMode);
    const setViewMode = useStore((state) => state.setViewMode);
    const neighborhoodPointerMode = useStore((state) => state.neighborhoodPointerMode);
    const setNeighborhoodPointerMode = useStore((state) => state.setNeighborhoodPointerMode);
    const selectedBackground = useStore((state) => state.selectedBackground)
    const setSelectedBackground = useStore((state) => state.setSelectedBackground)

    const outlineSelection = useStore((state) => state.outlineSelection)
    const spotlightSelection = useStore((state) => state.spotlightSelection)
    const setOutlineSelection = useStore((state) => state.setOutlineSelection)
    const setSpotlightSelection = useStore((state) => state.setSpotlightSelection)

    const setSettingsPanelOpen = useStore((state) => state.setSettingsPanelOpen)
    const settingsPanelOpen = useStore((state) => state.settingsPanelOpen)
    const showContours = useStore((state) => state.showContours)
    const setShowContours = useStore((state) => state.setShowContours)
    const backgroundColorWhite = useStore((state) => state.backgroundColorWhite)
    const setBackgroundColorWhite = useStore((state) => state.setBackgroundColorWhite)
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef(null);
    const handleOpen = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setOpen(true);
    };

    const handleClose = () => {
        timeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, 600); // 300ms delay before closing
    };


    const actions = [
        {
            icon:
                <Icon
                    onClick={() => {
                        setOutlineSelection(!outlineSelection)
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                    }}
                >
                    <img
                        src={outlineSelection ? DoNotOutlineSelectionIcon : OutlineSelectionIcon}
                        alt={'Outline Cells'}
                        style={{
                            width: '100%',

                        }}
                    />
                </Icon>,
            name: 'Outline Cells',
        },
        {
            icon: <Icon
                onClick={() => setSpotlightSelection(!spotlightSelection)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    // red background
                }}
            >
                <img
                    src={spotlightSelection ? DoNotSpotlightSelectionIcon : SpotlightSelectionIcon}
                    alt="Spotlight Cells"
                    style={{
                        width: '100%',

                    }}
                />
            </Icon>,
            name: 'Spotlight Cells'
        },
        {
            icon: <Icon
                onClick={() => setSelectedBackground(selectedBackground === 'show' ? 'hide' : 'show')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                }}
            >
                <img
                    src={selectedBackground === 'show' ? hideBackground : showBackground}
                    alt={selectedBackground === 'show' ? 'Show Background' : 'Hide Background'}
                    style={{
                        width: '100%',
                    }}
                />
            </Icon>,
            name: selectedBackground === 'show' ? 'Show Background' : 'Hide Background',
        },
        // { icon: <TextFieldsOutlinedIcon color={showClusterTitles ? 'primary' : 'inherit'} onClick={() => setShowClusterTitles(!showClusterTitles)} />, name: 'Label Selections' },

        {
            icon: <Icon
                onClick={() => setShowClusterTitles(!showClusterTitles)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    // red background
                }}
            >
                <img
                    src={LabelClusterIcon}
                    alt="Label Selections"
                    style={{
                        width: '90%',

                    }}
                />
            </Icon>,
            name: 'Label Selections'
        },
        {
            icon: <Icon
                onClick={() => setShowClusterOutlines(!showClusterOutlines)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    // red background
                }}
            >
                <img
                    src={OutlineClusterIcon}
                    alt="Outline Selections"
                    style={{
                        width: '70%',

                    }}
                />
            </Icon>,
            name: 'Outline Selections'
        },


        {
            icon: <Icon
                onClick={() => setShowContours(!showContours)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    // color based on showContours
                }}
            >
                <img
                    src={ContoursIcon}
                    alt="Outline Selections"
                    style={{
                        width: '70%',
                        filter: showContours ? 'grayscale(100%)' : 'none',
                    }}
                />
            </Icon>,
            name: showContours ? 'Hide Density' : 'Show Density'
        },
        {
            icon: <Icon
                onClick={() => setBackgroundColorWhite(!backgroundColorWhite)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    // color based on showContours
                }}
            >
                <img
                    src={BackgroundIcon}
                    alt="Outline Selections"
                    style={{
                        width: '70%',
                        filter: backgroundColorWhite ? 'brightness(0) invert(1)' : 'none',
                    }}
                />
            </Icon>,
            name: 'Background Color'
        },
        {
            icon: <Icon
                // onClick={() => setBackgroundColorWhite(!backgroundColorWhite)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    // color based on showContours
                }}
            >
                <img
                    src={DotsOnIcon}
                    alt="Outline Selections"
                    style={{
                        width: '70%',
                        filter: 'none',
                    }}
                />
            </Icon>,
            name: 'Show Points'
        },


        // { icon: <PrintIcon />, name: 'Print' },
        // { icon: <ShareIcon />, name: 'Share' },
    ];


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

    const {
        setActiveTool,
        activeTool,
        visibleTools = { pan: true, selectLasso: true },
        recenterOnClick = () => { },
        useStyles

    } = props;
    const handleFeatureCountChange = (event) => {
        setFeatureCount(event.target.value);
    };

    const handleTitleFontSizeChange = (event) => {
        setTitleFontSize(event.target.value);
    };



    const classes = useStyles();

    const onRecenterButtonCLick = () => {
        recenterOnClick();
    };


    return (
        <>
            <div className={classes.toolTopLeft}>
                {/* Top left positioned icon tool */}
                <IconTool
                    alt="channel settings"
                    onClick={() => {
                        setSettingsPanelOpen(!settingsPanelOpen)
                    }}
                    isActive={settingsPanelOpen}
                >
                    <img src={ChannelSettingsIcon} alt="Channel Settings" />
                </IconTool>
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
                    useStyles={useStyles}
                >
                    <CenterFocusStrong />
                </IconButton>

            </div>
            {dataset == 'B' ? null :
                <div className={classes.toolBottomLeft}>
                    {/* <IconTool
                    alt="visible layers"
                >
                    <Layers onMouseEnter={(e) => setAnchorEl(e.currentTarget)} />
                </IconTool> */}
                    <SpeedDial
                        ariaLabel="SpeedDial basic example"
                        icon={
                            <Layers style={{ color: 'black', width: '18px', height: '18px' }} />
                        }
                        direction="right"
                        open={open}
                        onOpen={handleOpen}
                        onClose={handleClose}
                        sx={{
                            '& .MuiSpeedDial-fab': {
                                width: '40px',
                                height: '40px',
                                backgroundColor: '#777777',
                                '&:hover': {
                                    backgroundColor: '#888888'
                                },
                                border: '2px solid white',
                                borderRadius: '50%',
                                overflow: 'hidden',
                            },
                            '& .MuiSpeedDialAction-fab': {
                                width: '40px',
                                height: '40px',
                                minHeight: 'unset',
                                margin: '0 4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            },
                            '& .MuiSpeedDial-actions': {
                                display: 'flex',
                                alignItems: 'center',
                                height: '40px',
                                paddingRight: '8px',
                                gap: '8px',
                            },
                            '& .MuiSpeedDialAction-staticTooltipLabel': {
                                fontSize: '0.75rem'
                            }
                        }}
                    >
                        {actions.map((action) => (
                            <SpeedDialAction
                                key={action.name}
                                icon={action.icon}
                                onMouseEnter={handleOpen}
                                tooltipTitle={action.name}
                                sx={{
                                    '& .MuiSvgIcon-root': {
                                        fontSize: '20px',
                                        color: 'white'
                                    },
                                    backgroundColor: '#111111',
                                    border: '2px solid white',
                                    overflow: 'hidden',
                                    borderRadius: '50%',

                                    '& .MuiIcon-root': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        height: '100%',
                                    },

                                    '& img': {
                                        // maxWidth: '65%',
                                        // maxHeight: '65%',
                                        objectFit: 'contain',
                                        margin: 'auto',
                                    },

                                    '&:hover': {
                                        backgroundColor: '#333333'
                                    }
                                }}
                            />
                        ))}
                    </SpeedDial>
                </div>
            }

        </>
    );
}
export default ToolMenu;

// <Menu
// anchorEl={anchorEl}
// open={Boolean(anchorEl)}
// onClose={() => setAnchorEl(null)}
// onClick={(e) => e.stopPropagation()}
// MenuListProps={{
//     onMouseLeave: () => setAnchorEl(null)
// }}
// anchorOrigin={{
//     vertical: 'bottom',
//     horizontal: 'left',
// }}
// PaperProps={{
//     style: {
//         width: '250px',
//     },
// }}
// >

// <MenuItem >
//     <Grid container alignItems="center" spacing={2}>
//         <Grid item>
//             
//         </Grid>
//         <Grid item>
//             <span>Outline Clusters</span>
//         </Grid>
//     </Grid>
// </MenuItem>
// <MenuItem onClick={() => setShowClusterTitles(!showClusterTitles)}>
//     <Grid container alignItems="center" spacing={2}>
//         <Grid item>
//             <TitleIcon color={showClusterTitles ? 'primary' : 'inherit'} />
//         </Grid>
//         <Grid item>
//             <span>Show Titles</span>
//         </Grid>
//     </Grid>
// </MenuItem>
// <MenuItem>
//     <Grid container alignItems="center" spacing={2}>
//         <Grid item xs={6}>
//             <span>Features</span>
//         </Grid>
//         <Grid item xs={6}>
//             <Select
//                 value={featureCount}
//                 onChange={handleFeatureCountChange}
//                 size="small"
//                 sx={{ height: '30px' }}
//             >
//                 {[0, 1, 2, 3, 4, 5].map((num) => (
//                     <MenuItem key={num} value={num}>{num}</MenuItem>
//                 ))}
//             </Select>
//         </Grid>
//     </Grid>
// </MenuItem>
// <MenuItem>
//     <Grid container alignItems="center" spacing={2}>
//         <Grid item xs={6}>
//             <span>Font Size</span>
//         </Grid>
//         <Grid item xs={6}>
//             <Select
//                 value={titleFontSize}
//                 onChange={handleTitleFontSizeChange}
//                 size="small"
//                 sx={{ height: '30px' }}
//             >
//                 {[8, 10, 12, 14, 16, 18, 20].map((size) => (
//                     <MenuItem key={size} value={size}>{size}</MenuItem>
//                 ))}
//             </Select>
//         </Grid>
//     </Grid>
// </MenuItem>
// </Menu>