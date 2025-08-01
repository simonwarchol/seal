import {
  VitessceConfig,
  CoordinationLevel as CL,
  hconcat,
  vconcat
} from "@vitessce/config";
import { useState, useEffect, useContext } from "react";
import "../index.css";
import "../Seal.css";
// import { VitS } from "@vitessce/vit-s";
import { Vitessce, PluginFileType, PluginViewType } from "@vitessce/all";
import {
  ViewType as vt,
  CoordinationType as ct,
  FileType as ft,
  DataType as dt
} from "@vitessce/constants";
import useStore from "../store";

import { ObsSetsManagerSubscriber } from "./setsManager/ObsSetsManagerSubscriber";
import { LayerControllerSubscriber } from "./controller/LayerControllerSubscriber";
import { SelectionsSummarySubscriber } from "./selectionSummary/SelectionSummarySubscriber"
import { SpotlightSubscriber } from "./spotlight/SpotlightSubscriber";

function Viewer({ value, setValue, height, config, width }) {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const datasetId = useStore((state) => state.datasetId);

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
    new PluginViewType("selectionSummary", SelectionsSummarySubscriber, [
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
      ct.FEATURE_TYPE,
      ct.FEATURE_VALUE_TYPE,
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
    clusterColumns: ["kmeans", "agcluster"],
    imageUrl: "http://localhost:8181/files/image.ome.tif",
    segmentationUrl: "http://localhost:8181/files/segmentation.ome.tif",

  };
  const gregDataset = {
    // embeddingImageUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/greg_tiled.ome.tif",
    embeddingImageUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/tiled.ome.tif",
    // embeddingImageUrl: "https://lin-2021-crc-atlas.s3.amazonaws.com/data/WD-76845-097.ome.tif",
    // embeddingSegmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/tiled-mask.ome.tif",
    embeddingSegmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/test-mask.ome.tif",
    // embeddingSegmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/greg_tiled-mask.ome.tif",
    // csvUrl: "http://localhost:8181/files/set_csv.csv",
    csvUrl: "https://seal-vis.s3.us-east-1.amazonaws.com/WD-76845-097/df.csv",
    parquetUrl: "https://seal-vis.s3.us-east-1.amazonaws.com/WD-76845-097/df.parquet",
    contourUrl: "https://seal-vis.s3.us-east-1.amazonaws.com/WD-76845-097/contour.json",
    clusterColumns: ["hdbscan"],
    imageUrl: "https://lin-2021-crc-atlas.s3.amazonaws.com/data/WD-76845-097.ome.tif",
    shapUrl: "https://seal-vis.s3.us-east-1.amazonaws.com/WD-76845-097/shap.parquet",
    segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/good-WD-76845-097.ome.tiff",
    // segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/better-tiled-mask.ome.tif",


  };
  const astroDataset = {
    embeddingImageUrl: "http://localhost:8181/data/astro/hybrid.ome.tif",
    embeddingSegmentationUrl: "http://localhost:8181/data/astro/hybrid.mask.ome.tif",
    csvUrl: "http://localhost:8181/data/astro/updated_astro.csv",
    clusterColumns: ["cluster"],
    imageUrl: "http://localhost:8181/data/astro/astro.ome.tif",
    segmentationUrl: "http://localhost:8181/data/astro/astro_seg_masks.ome.tif",
    // segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/better-tiled-mask.ome.tif",
  };
  const dan1Dataset = {
    embeddingImageUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/dan2.ome.tif",
    // embeddingImageUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/dan2.ome.tif",
    embeddingSegmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/dan2-mask.ome.tif",
    csvUrl: "http://localhost:8181/files/set_csv.csv",
    clusterColumns: ["kmeans"],
    imageUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/combined.ome.tif",
    // segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/cellRing_from_mcmicro.ome.tif",
    // segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/reprocessed_seg_mask.ome.tif ",
    // segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/nucleiRing.ome.tif",
    segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/reprocessed_seg_mask_nuclei.ome.tif",
    // segmentationUrl: "https://vae-bed.s3.us-east-2.amazonaws.com/better-tiled-mask.ome.tif",
  };

  const getDatasetConfig = (datasetId) => {
    const baseUrl = `https://seal-vis.s3.us-east-1.amazonaws.com/${datasetId}`;
    const conf = {
      embeddingImageUrl: `${baseUrl}/hybrid.ome.tif`,
      embeddingSegmentationUrl: `${baseUrl}/hybrid.mask.ome.tif`,
      parquetUrl: `${baseUrl}/df.parquet`,
      csvUrl: `${baseUrl}/df.csv`,
      clusterColumns: ["cluster"],
      imageUrl: `${baseUrl}/image.ome.tif`,
      segmentationUrl: `${baseUrl}/image.mask.ome.tif`,
      contourUrl: `${baseUrl}/contour.json`,
      shapUrl: `${baseUrl}/shap.parquet`
    };
    if (datasetId === 'WD-76845-097') {
      conf.clusterColumns = ["hdbscan"];
      // conf.csvUrl = "https://seal-vis.s3.us-east-1.amazonaws.com/WD-76845-097/df.csv";
      conf.csvUrl = "https://seal-vis.s3.us-east-1.amazonaws.com/WD-76845-097/small.csv";
      conf.imageUrl = "https://lin-2021-crc-atlas.s3.amazonaws.com/data/WD-76845-097.ome.tif";
      conf.segmentationUrl = "https://vae-bed.s3.us-east-2.amazonaws.com/good-WD-76845-097.ome.tiff";
    }
    return conf;
  };


  let dataset =  config || getDatasetConfig(datasetId) || gregDataset;
  // console.log('dataset', dataset);


  const vc = new VitessceConfig({
    schemaVersion: "1.0.16",
    name: "My config",
    description:
      "Small lung adenocarcinoma specimen from a tissue microarray (TMA), imaged using CyCIF.",
  });
  const obsSets = dataset?.clusterColumns.map((column) => {
    return {
      "name": column,
      "column": column
    }
  })
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
        obsSets: obsSets,
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
      url: dataset.imageUrl,
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
        obsSets: obsSets,
        tooltipsVisible: false
      },
      coordinationValues: {
        obsType: "cell",
        fileUid: 'orig',
      },
    })






  const v1 = vc.addView(ds0, "spotlight");
  // const v2 = vc.addView(ds0, "controller");
  const v3 = vc.addView(ds1, "spotlight");
  // const v4 = vc.addView(ds1, "setDiff");
  const v5 = vc.addView(ds1, "selectionSummary");
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
  vc.layout(vconcat(hconcat(v1, v3), v5));
  // vc.layout(hconcat(v1));


  return (
    <div id={"main-container"} style={{ width: '100%', height: height || windowHeight || '100%' }}>
      <Vitessce
        config={vc.toJSON()}
        height={height || windowHeight}
        pluginViewTypes={pluginViewTypes}
        theme="light"
      />
    </div>
  );
}

export default Viewer;
