import React, { useRef } from 'react';
import RcTooltip from 'rc-tooltip';
import { useVitessceContainer } from '@vitessce/vit-s';
import { useHelpTooltipStyles } from './styles.js';

/**
 * This is a small wrapper around the Tooltip component from the rc-tooltip library,
 * which is required to be able to apply theme styles to the tooltip.
 * The default `getTooltipContainer` function used by rc-tooltip
 * just returns `document.body` (see https://github.com/react-component/tooltip#props),
 * We want theme styles to be applied relative to the closest `.vitessce-container`
 * ancestor element.
 * https://github.com/vitessce/vitessce/pull/494#discussion_r395957914
 * @param {object} props Props are passed through to the <RcTooltip/> from the library.
 */
export default function HelpTooltip({
  title,
  content,
  overlayClassName = 'helpTooltip',  // Default value
  placement = 'top',                 // Default value
  trigger = 'hover',                 // Default value
  mouseEnterDelay = 0.2,             // Default value
  mouseLeaveDelay = 0,               // Default value
  destroyTooltipOnHide = true,       // Default value
  ...props
}) {
  const spanRef = useRef();
  const getTooltipContainer = useVitessceContainer(spanRef);

  const overlay = title || content;

  const classes = useHelpTooltipStyles();

  return (
    <>
      <span ref={spanRef} />
      <RcTooltip
        {...props}
        placement={placement}
        trigger={trigger}
        mouseEnterDelay={mouseEnterDelay}
        mouseLeaveDelay={mouseLeaveDelay}
        destroyTooltipOnHide={destroyTooltipOnHide}
        getTooltipContainer={getTooltipContainer}
        overlayClassName={classes[overlayClassName]}
        overlay={overlay}
      />
    </>
  );
}