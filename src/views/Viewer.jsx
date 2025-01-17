import {
  VitessceConfig,
  CoordinationLevel as CL,
  hconcat,
  vconcat
} from "@vitessce/config";
import { useState, useEffect, useContext } from "react";

import "../Seal.css";
// import { VitS } from "@vitessce/vit-s";
import { Vitessce, PluginFileType, PluginViewType } from "@vitessce/all";
import {
  ViewType as vt,
  CoordinationType as ct,
  FileType as ft,
  DataType as dt
} from "@vitessce/constants";


import { ObsSetsManagerSubscriber } from "./setsManager/ObsSetsManagerSubscriber";
import { LayerControllerSubscriber } from "./controller/LayerControllerSubscriber";
import { SpotlightSubscriber } from "./spotlight/SpotlightSubscriber";

function Viewer({ value, setValue, height }) {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const pluginViewTypes = [
    new PluginViewType("spotlight", SpotlightSubscriber, [
      ct.DATASET,
      ct.OBS_TYPE,
      ct.OBS_LABELS_TYPE,
      ct.FEATURE_TYPE,
      ct.FEATURE_VALUE_TYPE,
      ct.SPATIAL_ZOOM,
      ct.SPATIAL_ROTATION,
      ct.SPATIAL_IMAGE_LAYER,
      ct.SPATIAL_SEGMENTATION_LAYER,
      ct.SPATIAL_POINT_LAYER,
      ct.SPATIAL_NEIGHBORHOOD_LAYER,
      ct.SPATIAL_TARGET_X,
      ct.SPATIAL_TARGET_Y,
      ct.SPATIAL_TARGET_Z,
      ct.SPATIAL_ROTATION_X,
      ct.SPATIAL_ROTATION_Y,
      ct.SPATIAL_ROTATION_Z,
      ct.SPATIAL_ROTATION_ORBIT,
      ct.SPATIAL_ORBIT_AXIS,
      ct.SPATIAL_AXIS_FIXED,
      ct.OBS_FILTER,
      ct.OBS_HIGHLIGHT,
      ct.OBS_SET_SELECTION,
      ct.OBS_SET_HIGHLIGHT,
      ct.OBS_SET_COLOR,
      ct.FEATURE_HIGHLIGHT,
      ct.FEATURE_SELECTION,
      ct.FEATURE_VALUE_COLORMAP,
      ct.FEATURE_VALUE_COLORMAP_RANGE,
      ct.OBS_COLOR_ENCODING,
      ct.ADDITIONAL_OBS_SETS,
      ct.MOLECULE_HIGHLIGHT,
      ct.TOOLTIPS_VISIBLE,
    ]),
    new PluginViewType("setDiff", ObsSetsManagerSubscriber, [
      ct.DATASET,
      ct.DATASET,
      ct.OBS_TYPE,
      ct.OBS_SET_SELECTION,
      ct.OBS_SET_EXPANSION,
      ct.OBS_SET_HIGHLIGHT,
      ct.OBS_SET_COLOR,
      ct.SPATIAL_IMAGE_LAYER,

      ct.OBS_COLOR_ENCODING,
      ct.ADDITIONAL_OBS_SETS,
      ct.FEATURE_SELECTION,
    ]),
    new PluginViewType("controller", LayerControllerSubscriber, [
      ct.DATASET,
      ct.OBS_TYPE,
      ct.FEATURE_TYPE,
      ct.FEATURE_VALUE_TYPE,
      ct.SPATIAL_IMAGE_LAYER,
      ct.SPATIAL_SEGMENTATION_LAYER,
      ct.SPATIAL_POINT_LAYER,
      ct.SPATIAL_NEIGHBORHOOD_LAYER,
      ct.SPATIAL_ZOOM,
      ct.SPATIAL_TARGET_X,
      ct.SPATIAL_TARGET_Y,
      ct.SPATIAL_TARGET_Z,
      ct.SPATIAL_ROTATION_X,
      ct.SPATIAL_ROTATION_Y,
      ct.SPATIAL_ROTATION_Z,
      ct.SPATIAL_ROTATION_ORBIT,
      ct.SPATIAL_ORBIT_AXIS,
      ct.ADDITIONAL_OBS_SETS,
    ]),
  ];

  const exemplarDataset = {
    embeddingImageUrl: "http://localhost:8181/files/embedding_image.ome.tif",
    embeddingSegmentationUrl: "http://localhost:8181/files/embedding_segmentation.ome.tif",
    csvUrl: "http://localhost:8181/files/csv.csv",
    cluster2: "kmeans",
    cluster1: "agcluster",
    iamgeUrl: "http://localhost:8181/files/image.ome.tif",
    segmentationUrl: "http://localhost:8181/files/segmentation.ome.tif",

  };
  const gregDataset = {
    embeddingImageUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/tiled.ome.tif",
    // embeddingImageUrl: "https://lin-2021-crc-atlas.s3.amazonaws.com/data/WD-76845-097.ome.tif",
    embeddingSegmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/tiled-mask.ome.tif",
    csvUrl: "http://localhost:8181/files/set_csv.csv",
    cluster1: "kmeans",
    cluster2: "cluster_2d",
    iamgeUrl: "https://lin-2021-crc-atlas.s3.amazonaws.com/data/WD-76845-097.ome.tif",
    segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/good-WD-76845-097.ome.tiff",
    // segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/better-tiled-mask.ome.tif",


  };
  let dataset = exemplarDataset;


  const vc = new VitessceConfig({
    schemaVersion: "1.0.16",
    name: "My config",
    description:
      "Small lung adenocarcinoma specimen from a tissue microarray (TMA), imaged using CyCIF.",
  });
  const ds0 = vc
    .addDataset("embedding")
    .addFile({
      fileType: "image.ome-tiff",
      url: dataset.embeddingImageUrl,
      coordinationValues: {
        fileUid: 'embedding',
        obsType: 'cell',
      },
    })
    .addFile({
      url: dataset.embeddingSegmentationUrl,
      fileType: "obsSegmentations.ome-tiff",
      coordinationValues: {
        obsType: "cell",
        fileUid: 'embedding',
      },
    })
    .addFile({
      url: dataset.csvUrl,
      fileType: "obsLocations.csv",
      coordinationValues: {
        obsType: "cell",
        fileUid: 'embedding',
      },
      options: {
        obsIndex: "CellID",
        obsLocations: ["UMAP_X", "UMAP_Y"],
        tooltipsVisible: false

      }
    })
    .addFile({
      url: dataset.csvUrl,
      fileType: "obsSets.csv",
      options: {
        obsIndex: "CellID",
        obsSets: [
          {
            "name": dataset.cluster1,
            "column": dataset.cluster1
          },
          {
            "name": dataset.cluster2,
            "column": dataset.cluster2
          }
        ],
        tooltipsVisible: false
      },
      coordinationValues: {
        obsType: "cell",
        fileUid: 'embedding',
      },
    })



  const ds1 = vc
    .addDataset("orig")
    .addFile({
      fileType: "image.ome-tiff",
      url: dataset.iamgeUrl,
      options: {
        tooltipsVisible: false
      },
      coordinationValues: {
        fileUid: 'orig',
        obsType: 'cell',
      },

    })
    .addFile({
      url: dataset.segmentationUrl,
      fileType: "obsSegmentations.ome-tiff",
      coordinationValues: {
        obsType: "cell",
        fileUid: 'orig',
      },
      options: {
        tooltipsVisible: false
      }
    })
    .addFile({
      url: dataset.csvUrl,
      fileType: "obsLocations.csv",
      options: {
        obsIndex: "CellID",
        obsLocations: ["X_centroid", "Y_centroid"],
        tooltipsVisible: false

      },
      coordinationValues: {
        obsType: "cell",
        fileUid: 'orig',
      },
    })
    .addFile({
      url: dataset.csvUrl,
      fileType: "obsSets.csv",
      options: {
        obsIndex: "CellID",
        obsSets: [
          {
            "name": dataset.cluster1,
            "column": dataset.cluster1
          },
          {
            "name": dataset.cluster2,
            "column": dataset.cluster2
          }
        ],
        tooltipsVisible: false
      },
      coordinationValues: {
        obsType: "cell",
        fileUid: 'orig',
      },
    })






  const v1 = vc.addView(ds0, "spotlight");
  const v2 = vc.addView(ds0, "controller");
  const v3 = vc.addView(ds1, "spotlight");
  const v4 = vc.addView(ds1, "setDiff");
  // const v4 = vc.addView(ds1, "scatterplot", { mapping: 'UMAP' });
  const [zoomScope, xScope, yScope, pointLayer] = vc.addCoordination(
    ct.SPATIAL_ZOOM,
    ct.SPATIAL_TARGET_X,
    ct.SPATIAL_TARGET_Y,
    ct.SPATIAL_POINT_LAYER
  );
  v1.useCoordination(zoomScope, xScope, yScope, pointLayer);
  // const v4 = vc.addView(ds0, "setDiff");
  // const v4 = vc.addView(ds1, "myCustomZoomController");
  vc.layout(hconcat(vconcat(v2, v4), v1, v3));
  // vc.layout(hconcat(v1, v2));

  return (
    <div id={"main-container"}>
      <Vitessce
        config={vc.toJSON()}
<<<<<<< HEAD
        height={'200px'}
=======
        height={height || windowHeight}
>>>>>>> 92c3b7c07b429063644258255972e5c7d2ebd5ef
        pluginViewTypes={pluginViewTypes}
        theme="light"
      />
    </div>
  );
}

export default Viewer;
