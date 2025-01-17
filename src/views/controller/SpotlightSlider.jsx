import React, { useEffect, useState } from 'react';
import './SpotlightSlider.css';
import {
    Button,
    Slider,
    Grid,
    InputLabel,
    ToggleButton,
    ToggleButtonGroup,
    Icon,
} from "@mui/material";
import {
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from "@material-ui/icons";
import useStore from '../../store';
import showBackground from "../../public/ShowBackground.svg";
import hideBackground from "../../public/HideBackground.svg";
import spotlightSelection from "../../public/SpotlightSelection.svg";
import outlineSelection from "../../public/OutlineSelection.svg";


const shadows = [
    { type: 'polygon', points: "838 411.7 838 736.6 694 715.9 694 432.4 838 411.7" },
    { type: 'polygon', points: "982 391.1 982 757.2 894.7 744.7 838 736.6 838 411.7 894.7 403.6 982 391.1" },
    { type: 'polygon', points: "1126 370.5 1126 777.8 1095.4 773.5 982 757.2 982 391.1 1095.4 374.9 1126 370.5" },
    { type: 'polygon', points: "1270 349.8 1270 798.5 1126 777.8 1126 370.5 1270 349.8" },
    { type: 'polygon', points: "1414 329.2 1414 819.1 1296.1 802.2 1270 798.5 1270 349.9 1296.1 346.1 1414 329.2" },
    { type: 'polygon', points: "1558 308.6 1558 839.7 1496.8 831 1414 819.1 1414 329.2 1496.8 317.4 1558 308.6" },
    { type: 'polygon', points: "1702 288 1702 860.4 1697.5 859.7 1558 839.7 1558 308.6 1697.5 288.6 1702 288" },
    { type: 'path', d: "M1846,292.6v563.2c0,13.3-11.4,23.6-24.2,21.8l-119.8-17.2V288l119.8-17.2c12.8-1.8,24.2,8.4,24.2,21.8Z" },
];

// Data for buttons
const buttons = [
    { x: 621.7, y: 538.2, width: 36, height: 72 },
    { x: 748, y: 511.2, width: 36, height: 126 },
    { x: 892, y: 484.2, width: 36, height: 180 },
    { x: 1036, y: 457.2, width: 36, height: 234 },
    { x: 1180, y: 430.2, width: 36, height: 288 },
    { x: 1324, y: 403.2, width: 36, height: 342 },
    { x: 1468, y: 376.2, width: 36, height: 396 },
    { x: 1612, y: 349.2, width: 36, height: 450 },
    { x: 1756, y: 322.2, width: 36, height: 504 },
];
const SpotlightSlider = ({ setVisible, visible, titleClass, visibleSetting, setOpacity }) => {

    const selectedBackground = useStore((state) => state.selectedBackground)
    const setSelectedBackground = useStore((state) => state.setSelectedBackground)
    const selectedSelection = useStore((state) => state.selectedSelection)
    const setSelectedSelection = useStore((state) => state.setSelectedSelection)
    const Visibility = visibleSetting ? VisibilityIcon : VisibilityOffIcon;
    const [activeIndex, setActiveIndex] = useState(shadows.length - 1);
    const [previousActiveIndex, setPreviousActiveIndex] = useState(0); // New state variable

    const handleButtonClick = (index) => {
        if (!visible) return; // Only check if flashlight is visible
        setActiveIndex(index);
    };

    const handleSliderChange = (event, newValue) => {
        if (!visible) return; // Only check if flashlight is visible
        setActiveIndex(newValue - 1);
    };
    useEffect(() => {
        const opacity = (activeIndex + 1) / shadows.length;
        console.log('opacity', opacity, shadows.length, activeIndex);
        setOpacity(opacity);
    }, [activeIndex]);


    // Data for shadows





    return (
        <Grid container spacing={0} sx={{ width: '100%' }}>

            <Grid item classes={{ item: titleClass }}>
                <Button
                    aria-label="Toggle layer visibility"
                    onClick={(e) => {
                        // Needed to prevent affecting the expansion panel from changing
                        e.stopPropagation();
                        const nextVisible =
                            typeof visible === "boolean" ? !visible : false;
                        setVisible(nextVisible);

                    }}
                    // Make this black
                    sx={{
                        color: 'black',
                    }}
                    style={{
                        marginRight: 8,
                        marginBottom: 2,
                        padding: 0,
                        minWidth: 0,
                    }}
                >
                    <Visibility />
                </Button>
                Cell Segmentation
            </Grid>
            <Grid item xs={12}>
                <ToggleButtonGroup
                    value={'left'}
                    exclusive
                    aria-label="text alignment"
                >
                    {/* Background Visualization Options */}
                    <Grid 
                        container 
                        spacing={2} 
                        justifyContent="center"
                        alignItems="center"
                        sx={{ px: 2 }} // Add horizontal padding
                    >
                        {/* Background Column */}
                        <Grid 
                            item 
                            xs={6} 
                            sx={{ 
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}>
                                <span style={{ fontSize: '12px' }}>Background</span>
                                <div style={{
                                    display: 'flex',
                                    borderTop: '2px solid black',
                                }}>
                                    <ToggleButton
                                        value="show"
                                        selected={selectedBackground === 'show'}
                                        onClick={() => setSelectedBackground('show')}
                                        sx={{ opacity: selectedBackground === 'show' ? 1 : 0.5 }}
                                    >
                                        <Icon style={{ height: '60px', width: 'auto' }}>
                                            <img src={showBackground} />
                                        </Icon>
                                    </ToggleButton>
                                    <ToggleButton
                                        value="hide"
                                        selected={selectedBackground === 'hide'}
                                        onClick={() => setSelectedBackground('hide')}
                                        sx={{ opacity: selectedBackground === 'hide' ? 1 : 0.5 }}
                                    >
                                        <Icon style={{ height: '60px', width: 'auto' }}>
                                            <img src={hideBackground} />
                                        </Icon>
                                    </ToggleButton>
                                </div>
                            </div>
                        </Grid>

                        {/* Selection Column */}
                        <Grid 
                            item 
                            xs={6}
                            sx={{ 
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}>
                                <span style={{ fontSize: '12px' }}>Selection</span>
                                <div style={{
                                    display: 'flex',
                                    borderTop: '2px solid black',
                                }}>
                                    <ToggleButton
                                        value="spotlight"
                                        selected={selectedSelection === 'spotlight'}
                                        onClick={() => setSelectedSelection('spotlight')}
                                        sx={{ opacity: selectedSelection === 'spotlight' ? 1 : 0.5 }}
                                    >
                                        <Icon style={{ height: '60px', width: 'auto' }}>
                                            <img src={spotlightSelection} />
                                        </Icon>
                                    </ToggleButton>
                                    <ToggleButton
                                        value="outline"
                                        selected={selectedSelection === 'outline'}
                                        onClick={() => setSelectedSelection('outline')}
                                        sx={{ opacity: selectedSelection === 'outline' ? 1 : 0.5 }}
                                    >
                                        <Icon style={{ height: '60px', width: 'auto' }}>
                                            <img src={outlineSelection} />
                                        </Icon>
                                    </ToggleButton>
                                </div>
                            </div>
                        </Grid>
                    </Grid>
                </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12}
                container
                sx={{
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center' // Centers the slider vertically
                    , opacity: visible ? 1 : 0.1
                }}>


            </Grid>

            <Grid item xs={12} m={0} container
                sx={{
                    opacity: visible ? 1 : 0.1
                }}
            >
                <Grid item xs={6}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1873.3 650" version="1.1" >
                        <g id="flashlight">
                            <path
                                className="st6"
                                d="M372.1,474.2H127.3c-31.1,0-46.6,0-58.8,5.1-16.3,6.8-29.3,19.7-36.1,36.1-5.1,12.3-5.1,27.8-5.1,58.8s0,46.6,5.1,58.8c6.8,16.3,19.7,29.3,36.1,36.1,12.3,5.1,27.8,5.1,58.8,5.1h244.8c27.3,0,40.9,0,53.1,5.1v-212c-12.3,5.1-25.9,5.1-53.1,5.1Z"
                            />
                            <path
                                className="st5"
                                d="M352.3,574.2c0,13.8-11.2,25-25,25h-66.7c-13.8,0-25-11.2-25-25s11.2-25,25-25h66.7c13.8,0,25,11.2,25,25Z"
                                onClick={() => {
                                    if (activeIndex !== -1) {
                                        // Flashlight is on, turn it off
                                        setPreviousActiveIndex(activeIndex);
                                        setActiveIndex(-1);
                                    } else {
                                        // Flashlight is off, restore previous level
                                        setActiveIndex(previousActiveIndex);
                                    }
                                }}
                                style={{
                                    cursor: 'pointer',
                                }}
                            />
                            <path
                                className="st4"
                                d="M466.4,713.2l108.1,108.1c9.1,9.1,13.9,13.9,19.5,16.5V310.5c-5.6,2.6-10.4,7.4-19.5,16.5l-108.1,108.1c-18.2,18.2-27.8,27.8-39.1,33.1v212c11.3,5.3,20.9,14.9,39.1,33Z"
                            />
                            <path
                                className="st6"
                                d="M694,374.2v400c0,5.4,0,10.3,0,14.9-.2,21.8-1.6,34-9.7,42s-25.5,9.8-56.9,9.8h-5.7c-13.6,0-20.4,0-26.6-2.5V310.5c6.1-2.5,12.9-2.5,26.6-2.5h5.7c31.4,0,47.1,0,56.9,9.8,8.1,8.1,9.5,20.3,9.7,42,0,4.5,0,9.5,0,14.9Z"
                            />
                            <path
                                className="st1"
                                d="M1846,292.6v563.2c0,13.3-11.4,23.6-24.2,21.8l-119.8-17.2-139.6-20-61.2-8.8-82.8-11.9-117.9-16.9-26.1-3.7-144-20.6-30.5-4.4-113.5-16.2-87.3-12.5-56.7-8.1-144-20.6v-283.6l144-20.6,56.7-8.1,87.3-12.5,113.5-16.3,30.5-4.4,144-20.6,26.1-3.7,117.9-16.9,82.8-11.9,61.2-8.8,139.6-20,119.8-17.2c12.8-1.8,24.2,8.4,24.2,21.8Z"
                            />
                        </g>
                        <g id="flashlight-shadow">
                            {shadows.map((shadow, index) => (
                                shadow.type === 'polygon' ? (
                                    <polygon
                                        key={index}
                                        className="st3"
                                        points={shadow.points}
                                        style={{ opacity: index <= activeIndex ? 0 : 1 }}
                                    />
                                ) : (
                                    <path
                                        key={index}
                                        className="st3"
                                        d={shadow.d}
                                        style={{ opacity: index <= activeIndex ? 0 : 1 }}
                                    />
                                )
                            ))}
                        </g>
                        <g id="flashlight-buttons">
                            {buttons.map((button, index) => (
                                <rect
                                    key={index}
                                    className="st7"
                                    fillOpacity={index - 1 === activeIndex ? 1 : 0.5}
                                    x={button.x}
                                    y={button.y}
                                    width={button.width}
                                    height={button.height}
                                    rx="7.2"
                                    ry="7.2"
                                    onClick={() => {
                                        console.log('clicking', index);
                                        handleButtonClick(index - 1)
                                    }}
                                // make cursor
                                />
                            ))}
                        </g>
                    </svg>
                </Grid>
                <Grid item xs={6} sx={{ paddingLeft: 2, paddingRight: 2 }}>
                    <Slider
                        id={`layer-${name}-opacity-closed`}
                        value={activeIndex + 1}
                        onChange={handleSliderChange}
                        valueLabelDisplay="off"
                        aria-label={`Adjust flashlight level for ${name}`}
                        min={0}
                        max={shadows.length}
                        step={1}
                        orientation="horizontal"
                        size="small"
                        sx={{

                            width: '100%',
                            '& .MuiSlider-thumb': {
                                marginTop: 0,  // Remove default top margin
                                marginBottom: 0 // Remove default bottom margin
                            }
                        }}
                    />
                </Grid>
            </Grid>
        </Grid >
    );
};

export default SpotlightSlider;