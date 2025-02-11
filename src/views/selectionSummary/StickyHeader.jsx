import React from 'react';


import { ToggleButton, ToggleButtonGroup } from '@mui/material';

function StickyHeader({ viewMode, handleViewChange, headerRef }) {
    return (
      <div style={{
        position: 'sticky',
        top: 0,
        width: '100%',
        zIndex: 1000,
        marginBottom: '2px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        margin: '5px'
      }}>
        <div style={{ width: '80px' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            size="small"
            style={{
              backgroundColor: 'rgba(30, 30, 30, 0.8)',
              border: '1px solid #333333',
              borderRadius: '4px',
              width: '80px'
            }}
          >
            <ToggleButton
              value="embedding"
              style={{
                color: viewMode === 'embedding' ? '#ffffff' : '#888888',
                textTransform: 'none',
                padding: '2px 8px',
                fontSize: '0.75rem',
                flex: 1
              }}
            >
              {viewMode === 'embedding' ? 'Emb.' : 'E'}
            </ToggleButton>
            <ToggleButton
              value="spatial"
              style={{
                color: viewMode === 'spatial' ? '#ffffff' : '#888888',
                textTransform: 'none',
                padding: '2px 8px',
                fontSize: '0.75rem',
                flex: 1
              }}
            >
              {viewMode === 'spatial' ? 'Spatial' : 'S'}
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div ref={headerRef} style={{ flex: 1, height: '60px', marginLeft: '5px'}} />
      </div>
    );
  }
  export default StickyHeader;