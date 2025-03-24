import React, { useCallback, useState, useEffect } from "react";

import { Grid, Slider, IconButton } from "@material-ui/core";
import { debounce, isEqual } from "lodash-es";

import {
  getSourceFromLoader,
  getMultiSelectionStats,
  toRgbUIString,
  abbreviateNumber,
  DOMAINS,
} from "@vitessce/spatial-utils";
import ChannelOptions from "./ChannelOptions.jsx";
import {
  ChannelSelectionDropdown,
  ChannelVisibilityCheckbox,
} from "./shared-channel-controls.jsx";
import { useChannelSliderStyles } from "./styles.js";
import { Lock as LockIcon } from "@material-ui/icons";
import { LockOpen as LockOpenIcon } from "@material-ui/icons";
/**
 * Slider for controlling current colormap.
 * @prop {string} color Current color for this channel.
 * @prop {arry} slider Current value of the slider.
 * @prop {function} handleChange Callback for each slider change.
 * @prop {array} domain Current max/min allowable slider values.
 */
function ChannelSlider({
  color,
  slider = [0, 0],
  handleChange,
  domain = [0, 0],
  dtype,
  disabled,
}) {
  const [min, max] = domain;
  const sliderCopy = slider.slice();
  if (slider[0] < min) {
    sliderCopy[0] = min;
  }
  if (slider[1] > max) {
    sliderCopy[1] = max;
  }
  const handleChangeDebounced = useCallback(
    debounce(handleChange, 3, { trailing: true }),
    [handleChange]
  );

  const classes = useChannelSliderStyles();

  const step =
    max - min < 500 && dtype.startsWith("Float") ? (max - min) / 500 : 1;
  return (
    <Slider
      classes={{ valueLabel: classes.valueLabel }}
      value={slider}
      valueLabelFormat={abbreviateNumber}
      onChange={(e, v) => handleChangeDebounced(v)}
      valueLabelDisplay="auto"
      getAriaLabel={(index) => {
        const labelPrefix =
          index === 0 ? "Low value slider" : "High value slider";
        return `${labelPrefix} for ${color} colormap channel`;
      }}
      getAriaValueText={() => `Current colormap values: ${color}-${slider}`}
      min={min}
      max={max}
      step={step}
      orientation="horizontal"
      style={{ color, marginTop: "7px" }}
      disabled={disabled}
    />
  );
}

/**
 * Controller for the handling the colormapping sliders.
 * @prop {boolean} visibility Whether or not this channel is "on"
 * @prop {array} slider Current slider range.
 * @prop {array} color Current color for this channel.
 * @prop {array} domain Current max/min for this channel.
 * @prop {string} dimName Name of the dimensions this slider controls (usually "channel").
 * @prop {boolean} colormapOn Whether or not the colormap (viridis, magma etc.) is on.
 * @prop {object} channelOptions All available options for this dimension (i.e channel names).
 * @prop {function} handlePropertyChange Callback for when a property (color, slider etc.) changes.
 * @prop {function} handleChannelRemove When a channel is removed, this is called.
 * @prop {function} handleIQRUpdate When the IQR button is clicked, this is called.
 * @prop {number} selectionIndex The current numeric index of the selection.
 */
function RasterChannelController({
  visibility = false,
  slider,
  color,
  channels,
  channelId,
  domainType: newDomainType,
  dimName,
  theme,
  loader,
  colormapOn,
  channelOptions,
  handlePropertyChange,
  handleChannelRemove,
  handleIQRUpdate,
  selectionIndex,
  isLoading,
  use3d: newUse3d,
  lockedChannels,
  setLockedChannels,
}) {
  const { dtype } = getSourceFromLoader(loader);
  const [domain, setDomain] = useState(null);
  const [domainType, setDomainType] = useState(null);
  const [use3d, setUse3d] = useState(null);
  const [selection, setSelection] = useState([
    { ...channels[channelId].selection },
  ]);
  const rgbColor = toRgbUIString(colormapOn, color, theme);
  const [thisChannelIsLocked, setThisChannelIsLocked] = useState(
    lockedChannels?.[channelId] || false
  );



  useEffect(() => {
    // Use mounted to prevent state updates/re-renders after the component has been unmounted.
    // All state updates should happen within the mounted check.
    let mounted = true;
    if (dtype && loader && channels) {
      const selections = [{ ...channels[channelId].selection }];
      let domains;
      const hasDomainChanged = newDomainType !== domainType;
      const has3dChanged = use3d !== newUse3d;
      const hasSelectionChanged = !isEqual(selections, selection);
      if (hasDomainChanged || hasSelectionChanged || has3dChanged) {
        if (newDomainType === "Full") {
          domains = [DOMAINS[dtype]];
          const [newDomain] = domains;
          if (mounted) {
            setDomain(newDomain);
            setDomainType(newDomainType);
            if (hasSelectionChanged) {
              setSelection(selections);
            }
            if (has3dChanged) {
              setUse3d(newUse3d);
            }
          }
        } else {
          getMultiSelectionStats({
            loader: loader.data,
            selections,
            use3d: newUse3d,
          }).then((stats) => {
            // eslint-disable-next-line prefer-destructuring
            domains = stats.domains;
            const [newDomain] = domains;
            if (mounted) {
              setDomain(newDomain);
              setDomainType(newDomainType);
              if (hasSelectionChanged) {
                setSelection(selections);
              }
              if (has3dChanged) {
                setUse3d(newUse3d);
              }
            }
          });
        }
      }
    }
    return () => {
      mounted = false;
    };
  }, [
    domainType,
    channels,
    channelId,
    loader,
    dtype,
    newDomainType,
    selection,
    newUse3d,
    use3d,
  ]);

  const toggleChannelLock = () => {
    lockedChannels[channelId] = !lockedChannels[channelId];
    console.log("Locked Channels", lockedChannels);
    setThisChannelIsLocked(lockedChannels[channelId]);
    setLockedChannels(lockedChannels);
  };

  const createSelection = (index) => ({ [dimName]: index });
  return (
    <Grid container direction="column" m={1} justifyContent="center">
      <Grid container direction="row" justifyContent="space-between">
        <Grid item xs={10}>
          <ChannelSelectionDropdown
            handleChange={(v) =>
              handlePropertyChange("selection", createSelection(v))
            }
            selectionIndex={selectionIndex}
            channelOptions={channelOptions}
            disabled={isLoading}
          />
        </Grid>

        <Grid item xs={1}>
          <IconButton
            onClick={toggleChannelLock}
            style={{ padding: "6px 6px 6px 0px" }}
            aria-label="Remove channel"
          >
            {thisChannelIsLocked ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
        </Grid>
        <Grid item xs={1} style={{ marginTop: "4px" }} className={'poop'}>
          <ChannelOptions
            handlePropertyChange={handlePropertyChange}
            handleChannelRemove={handleChannelRemove}
            handleIQRUpdate={handleIQRUpdate}
            disabled={isLoading}
          />
        </Grid>
      </Grid>
      <Grid container direction="row" justifyContent="space-between">
        <Grid item xs={2}>
          <ChannelVisibilityCheckbox
            color={rgbColor}
            checked={visibility}
            toggle={() => handlePropertyChange("visible", !visibility)}
            disabled={isLoading}
          />
        </Grid>
        <Grid item xs={9}>
          <ChannelSlider
            color={rgbColor}
            slider={slider}
            domain={domain || DOMAINS[dtype]}
            dtype={dtype}
            handleChange={(v) => handlePropertyChange("slider", v)}
            disabled={isLoading}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}

export default RasterChannelController;
