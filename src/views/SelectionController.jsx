/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
// import {
//   CoordinationType,
//   TitleInfo,
//   useCoordination,
// } from 'vitessce';
import { CoordinationType } from "@vitessce/constants";
import { TitleInfo } from "@vitessce/vit-s";
import { useCoordination } from "@vitessce/vit-s";
import { getApiUrl } from '../config/api'
import useStore from "../store";
export function MyCustomZoomControllerSubscriber(props) {
  const {
    coordinationScopes,
    removeGridComponent,
    theme,
    title = "Selection Feature Importance",
  } = props;

  const [{ additionalObsSets }] = useCoordination(
    [
      CoordinationType.DATASET,
      CoordinationType.SPATIAL_ZOOM,
      CoordinationType.ADDITIONAL_OBS_SETS,
    ],
    coordinationScopes
  );

  const [featureImportance, setFeatureImportance] = useState([]);
  const serverUrl = useStore((state) => state.serverUrl);
  const datasetId = useStore((state) => state.datasetId);
  useEffect(() => {
    const postSelection = async () => {
      setFeatureImportance([]);
      if (!additionalObsSets?.tree) return;

      const selectionUrl = serverUrl ? `${serverUrl}/selection` : getApiUrl("selection");
      const payload = {
        selections: additionalObsSets.tree,
      };
      const selectionPost = await fetch(`${selectionUrl}/${datasetId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const selectionResponse = await selectionPost.json();
      // Selection REsponse DAta selectionResponse?.data
      // Sory this by value, descending
      selectionResponse?.data.sort((a, b) => b.value - a.value);
      setFeatureImportance(selectionResponse?.data);
    };
    postSelection();

    // Make a post request to http://localhost:8181/selection with the new additionalObsSets
  }, [additionalObsSets, serverUrl, datasetId]);

  return (
    <TitleInfo
      title={title}
      theme={theme}
      removeGridComponent={removeGridComponent}
      isReady
    >
      {/* Iterate over feature Importance, displaying  */}
      {featureImportance.map((e) => (
        <div key={e.feature}>
          {/* Round to 4 decimals */}
          <span className="featureName">{e.feature}:</span>
          <span> {e.value.toFixed(4)}</span>
        </div>
      ))}
    </TitleInfo>
  );
}
