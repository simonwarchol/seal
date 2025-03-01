import React, {
    useState,
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
import Icon from '@mui/material/Icon';
import TextFieldsOutlinedIcon from '@mui/icons-material/TextFieldsOutlined';
import showBackground from "../../public/ShowBackground.svg";
import hideBackground from "../../public/HideBackground.svg";
import CellBackground from "../../public/CellBackground.svg";
import spotlightSelection from "../../public/SpotlightSelection.svg";
import outlineSelection from "../../public/OutlineSelection.svg";

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
    const selectedSelection = useStore((state) => state.selectedSelection)
    const setSelectedSelection = useStore((state) => state.setSelectedSelection)
    const actions = [
        {
            icon: <Icon
                onClick={() => {
                    setSelectedSelection(selectedSelection === 'spotlight' ? 'outline' : 'spotlight')
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                }}
            >
                <img
                    src={selectedSelection === 'spotlight' ? spotlightSelection : outlineSelection}
                    alt={selectedSelection === 'spotlight' ? 'Spotlight Selection' : 'Outline Selection'}
                    style={{
                        width: '22px',  // Set a specific size
                        height: '22px', // Make it square
                        margin: 'auto', // Center in flex container
                        display: 'block', // Remove any inline spacing
                        opacity: 0.75,
                        border: '1px solid black',
                        borderRadius: '5px'
                    }}
                />
            </Icon>,
            name: selectedSelection === 'spotlight' ?  'Outline Selection':'Spotlight Selection',
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
                }}
            >
                <img
                    src={selectedBackground === 'show' ? showBackground : hideBackground}
                    alt={selectedBackground === 'show' ? 'Hide Background' : 'Show Background'}
                    style={{
                        width: '22px',  // Set a specific size
                        height: '22px', // Make it square
                        margin: 'auto', // Center in flex container
                        display: 'block', // Remove any inline spacing
                        opacity: 0.75,
                        border: '1px solid black',
                        borderRadius: '5px'
                    }}
                />
            </Icon>,
            name: selectedBackground === 'show' ?  'Hide Background':'Show Background',
        }, 
        { icon: <TextFieldsOutlinedIcon color={showClusterTitles ? 'primary' : 'inherit'} onClick={() => setShowClusterTitles(!showClusterTitles)} />, name: 'Label Selections' },

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
                        width: '24px',  // Set a specific size
                        height: '24px', // Make it square
                        margin: 'auto', // Center in flex container
                        display: 'block' // Remove any inline spacing
                    }}
                />
            </Icon>,
            name: 'Outline Selections'
        },
        // { icon: <PrintIcon />, name: 'Print' },
        // { icon: <ShareIcon />, name: 'Share' },
    ];
    // <MenuItem>
    //     <Grid container alignItems="center" spacing={2}>
    //         <Grid item>
    //             <TitleIcon color={showClusterTitles ? 'primary' : 'inherit'} />
    //         </Grid>
    //         <Grid item>
    //             <span>Show Titles</span>
    //         </Grid>
    //     </Grid>
    // </MenuItem>
    //     <IconButton
    //     size="small"
    //     onClick={(e) => {
    //         e.stopPropagation();
    //         setShowNeighborhood(!showNeighborhood);
    //     }}
    //     style={{
    //         padding: 4,
    //         position: 'relative',
    //         visibility: compareMode ? 'hidden' : 'visible'
    //     }}
    // >
    //     <img
    //         src={NeighborhoodIcon}
    //         alt="Neighborhood"
    //         style={{
    //             width: 16,
    //             height: 16,
    //             filter: showNeighborhood ? 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(40%) contrast(119%)' : 'none'
    //         }}
    //     />
    // </IconButton>

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
            <div className={classes.toolTopRight}>
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
                    // open={true}
                    direction="down"
                    sx={{
                        '& .MuiSpeedDial-fab': {
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#777777',
                            '&:hover': {
                                backgroundColor: '#888888'
                            },
                        },
                        '& .MuiSpeedDialAction-fab': {
                            width: '30px',
                            height: '30px',
                            minHeight: 'unset',
                            marginTop: '-3px',

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
                            tooltipTitle={action.name}
                            sx={{
                                '& .MuiSvgIcon-root': {
                                    fontSize: '18px',
                                    color: 'white'
                                },
                                backgroundColor: '#111111',
                                // border: '1px solid white',
                                
                                // red background   
                                '&:hover': {
                                    backgroundColor: '#333333'
                                }
                            }}
                        />
                    ))}
                </SpeedDial>
            </div>

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