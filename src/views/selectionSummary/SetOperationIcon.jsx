import React from 'react';

const basePaths = {
  background: "M0,0 v221 h374 v-221 z",
  leftCircle: "M141,28.5c-45.3,0-82,36.7-82,82s36.7,82,82,82s82-36.7,82-82S186.3,28.5,141,28.5z",
  rightCircle: "M233,28.5c-45.3,0-82,36.7-82,82s36.7,82,82,82s82-36.7,82-82S278.3,28.5,233,28.5z",
  leftOnly: "M187,178.4c-13.1,8.9-29,14.1-46,14.1c-45.3,0-82-36.7-82-82s36.7-82,82-82c17,0,32.9,5.2,46,14.1c-21.7,14.7-36,39.6-36,67.9s14.3,53.1,36,67.9z",
  rightOnly: "M315,110.5c0,45.3-36.7,82-82,82c-17,0-32.9-5.2-46-14.1c21.7-14.7,36-39.6,36-67.9s-14.3-53.1-36-67.9c13.1-8.9,29-14.1,46-14.1c45.3,0,82,36.7,82,82z",
  intersection: "M223,110.5c0,28.2-14.3,53.1-36,67.9c-21.7-14.7-36-39.6-36-67.9s14.3-53.1,36-67.9c21.7,14.7,36,39.6,36,67.9z"
};

export const iconConfigs = {
    'a_minus_intersection': { paths: ['leftOnly'], color: '#9467bd' },
    'intersection': { paths: ['intersection'], color: '#17becf' },
    'b_minus_intersection': { paths: ['rightOnly'], color: '#d62728' },
    'a_plus_b_minus_intersection': { paths: ['leftOnly', 'rightOnly'], color: '#ff7f0e' },
    'a_plus_b': { paths: ['leftOnly', 'rightOnly', 'intersection'], color: '#67a61f' },
    'complement': { paths: ['leftOnly', 'rightOnly', 'intersection'], color: '#e6ab03' } // Changed this line
  };

const SetOperationIcon = ({ type, size = 30, disabled = false }) => {
  const baseStyle = {
    opacity: disabled ? 0.3 : 1,
    cursor: disabled ? 'default' : 'pointer',
  };

  const config = iconConfigs[type];
  if (!config) return null;

  return (
    <svg width={size} height={size} viewBox="0 0 374 221" style={baseStyle}>
      <path d={basePaths.background} fill={config.background || 'none'} stroke="white" strokeWidth="2" />
      {config.paths?.map(path => (
        <path key={path} d={basePaths[path]} fill={config.color} stroke="none" />
      ))}
      {config.fills?.map(path => (
        <path key={path} d={basePaths[path]} fill={config.color} stroke="none" />
      ))}
      <path d={basePaths.leftCircle} fill="none" stroke="white" strokeWidth="2" />
      <path d={basePaths.rightCircle} fill="none" stroke="white" strokeWidth="2" />
    </svg>
  );
};

export default SetOperationIcon;