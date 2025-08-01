import React, { useState } from 'react';
import { makeStyles, MenuItem } from '@material-ui/core';
import { MoreVert as MoreVertIcon } from '@material-ui/icons';
import { PopperMenu } from '@vitessce/vit-s';
import { useSpanStyles } from './styles.js';
import ColorPalette from './ColorPalette.jsx';

const useStyles = makeStyles((theme) => ({
  menuButton: {
    backgroundColor: 'transparent',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    '& .MuiSvgIcon-root': {
      color: '#ffffff',
    },
  },
  colors: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
    paddingLeft: '2px',
    paddingRight: '2px',
  },
  menuPaper: {
    // Add any necessary styles for the menu paper
  },
}));

function MuiSpan(props) {
  const { children } = props;
  const classes = useSpanStyles();
  return <span className={classes.span}>{children}</span>;
}

/**
 * Dropdown for options for a channel on the three dots button.
 * @prop {function} handlePropertyChange Callback for changing property (color, IQR of sliders).
 * @prop {function} handleChannelRemove Callback for channel removal.
 * @prop {function} handleIQRUpdate Callback for IQR slider update.
 */
function ChannelOptions({ handlePropertyChange, handleChannelRemove, handleIQRUpdate }) {
  const [open, setOpen] = useState(false);

  const classes = useStyles();

  const handleColorSelect = (color) => {
    handlePropertyChange('color', color);
  };

  const handleRemove = () => {
    setOpen(false);
    handleChannelRemove();
  };

  return (
    <PopperMenu
      open={open}
      setOpen={setOpen}
      buttonIcon={<MoreVertIcon 
        fontSize="small" 
        style={{ 
          color: '#ffffff',
          fill: '#ffffff'
        }} 
      />}
      buttonClassName={classes.menuButton}
      aria-label="Open channel options menu"
      PopperProps={{
        className: classes.menuPaper
      }}
    >
      <MenuItem dense disableGutters onClick={handleRemove} aria-label="Click to remove channel">
        <MuiSpan>Remove</MuiSpan>
      </MenuItem>
      <MenuItem
        dense
        disableGutters
        onClick={handleIQRUpdate}
        aria-label="Click to use IQR for channel"
      >
        <MuiSpan>Use IQR</MuiSpan>
      </MenuItem>
      <MenuItem
        dense
        disableGutters
        className={classes.colors}
        aria-label="Click to select color for channel"
      >
        <ColorPalette handleChange={handleColorSelect} />
      </MenuItem>
    </PopperMenu>
  );
}

export default ChannelOptions;
