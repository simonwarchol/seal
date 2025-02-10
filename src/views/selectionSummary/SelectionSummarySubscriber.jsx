import React from 'react';
import { useCoordination, TitleInfo } from '@vitessce/vit-s';
import { COMPONENT_COORDINATION_TYPES, ViewType } from '@vitessce/constants-internal';
import { capitalize } from '@vitessce/utils';
import { Card, CardContent, Typography } from '@material-ui/core';

function SelectionsDisplay({ selections }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Selections</Typography>
        {selections && selections.length > 0 ? (
          <ul>
            {selections.map((selection, index) => (
              <li key={index}>{selection.join(' > ')}</li>
            ))}
          </ul>
        ) : (
          <Typography>No selections available.</Typography>
        )}
      </CardContent>
    </Card>
  );
}


export function SelectionsSummarySubscriber(props) {
  const { coordinationScopes, title: titleOverride, theme } = props;

  const [{ obsType, obsSetSelection }] = useCoordination(
    COMPONENT_COORDINATION_TYPES[ViewType.OBS_SETS],
    coordinationScopes
  );

  const title = titleOverride || `${capitalize(obsType)} Selections`;

  return (

    <TitleInfo
      title={title}
      isScroll
      closeButtonVisible={false}
      downloadButtonVisible={false}
      removeGridComponent={false}
      urls={[]}
      theme={theme}
      isReady={true}
      helpText={''}
    >
      <SelectionsDisplay selections={obsSetSelection} />

    </TitleInfo>
  );
}
