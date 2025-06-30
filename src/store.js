import { create } from 'zustand'

const useStore = create((set) => ({
    datasetId: null,
    setDatasetId: (id) => set({ datasetId: id }),
    lockedChannels: [true],
    setLockedChannels: (channels) => set({ lockedChannels: channels }),
    showSpatialSignatures: false,
    setShowSpatialSignatures: (show) => set({ showSpatialSignatures: show }),
    showVennDiagram: false,
    setShowVennDiagram: (show) => set({ showVennDiagram: show }),
    showSankey: false,
    setShowSankey: (show) => set({ showSankey: show }),
    showFeatureImportance: false,
    setShowFeatureImportance: (show) => set({ showFeatureImportance: show }),
    showScatterPlot: false,
    setShowScatterPlot: (show) => set({ showScatterPlot: show }),
    selectionPath: [],
    setSelectionPath: (path) => set({ selectionPath: path }),
    setFeatures: {},
    setSetFeatures: (features) => set((state) => {
        // If features is a function, call it with previous state
        if (typeof features === 'function') {
            return { setFeatures: features(state.setFeatures) };
        }
        // If it's an object, merge it with existing state
        return {
            setFeatures: {
                ...state.setFeatures,
                ...features
            }
        };
    }),
    hoverSelection: null,
    setHoverSelection: (selection) => set({ hoverSelection: selection }),
    hoverClusterOpacities: {},
    setHoverClusterOpacities: (opacities) => set({ hoverClusterOpacities: opacities }),
    showClusterOutlines: false,
    setShowClusterOutlines: (show) => set({ showClusterOutlines: show }),
    showClusterTitles: false,
    setShowClusterTitles: (show) => set({ showClusterTitles: show }),
    hoveredCluster: null,
    setHoveredCluster: (cluster) => set({ hoveredCluster: cluster }),
    selectedBackground: 'hide',
    setSelectedBackground: (background) => set({ selectedBackground: background }),
    outlineSelection: true,
    setOutlineSelection: (outline) => set({ outlineSelection: outline }),
    spotlightSelection: false,
    setSpotlightSelection: (spotlight) => set({ spotlightSelection: spotlight }),
    // selectedSelection: 'outline',
    // setSelectedSelection: (selection) => set({ selectedSelection: selection }),
    featureCount: 3,
    setFeatureCount: (count) => set({ featureCount: count }),
    titleFontSize: 14,
    setTitleFontSize: (size) => set({ titleFontSize: size }),
    compareMode: false,
    setCompareMode: (mode) => set({ compareMode: mode }),
    neighborhoodPointerMode: false,
    setNeighborhoodPointerMode: (mode) => set({ neighborhoodPointerMode: mode }),
    neighborhoodMode: 'knn', // 'knn' or 'distance'
    setNeighborhoodMode: (mode) => set({ neighborhoodMode: mode }),
    neighborhoodKnn: 10,
    setNeighborhoodKnn: (knn) => set({ neighborhoodKnn: knn }),
    neighborhoodRadius: 50,
    setNeighborhoodRadius: (radius) => set({ neighborhoodRadius: radius }),
    neighborhoodCoordinateSpace: 'spatial', // 'spatial' or 'embedding'
    setNeighborhoodCoordinateSpace: (space) => set({ neighborhoodCoordinateSpace: space }),
    importanceInColor: true,
    setImportanceInColor: (value) => set({ importanceInColor: value }),
    viewMode: 'embedding',
    setViewMode: (viewMode) => set({ viewMode }),
    // Add new properties for channels
    channelSelection: {},
    setChannelSelection: (selection) => set({ channelSelection: selection }),
    hiddenFeatures: ['DNA (2)', 'DNA (3)', 'DNA (4)', 'DNA (5)', 'DNA (6)', 'DNA (7)', 'DNA (8)', 'DNA (9)', 'DNA (10)'],
    setHiddenFeatures: (features) => set({ hiddenFeatures: features }),
    settingsPanelOpen: false,
    setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),
    contours: [],
    setContours: (contours) => set({ contours }),
    showContours: false,
    setShowContours: (show) => set({ showContours: show }),
    maxSelectionSize: 0,
    setMaxSelectionSize: (size) => set({ maxSelectionSize: size }),
    maxRelativeOccurance: 0,
    setMaxRelativeOccurance: (occurance) => set({ maxRelativeOccurance: occurance }),
    currentDataset: null,
    setDataset: (datasetId) => set({ currentDataset: datasetId }),
    serverUrl: null,
    setServerUrl: (url) => set({ serverUrl: url }),
    backgroundColorWhite: null,
    setBackgroundColorWhite: (color) => set({ backgroundColorWhite: color }),
    showPoints: false,
    setShowPoints: (show) => set({ showPoints: show }),
    showLolipops: true,
    setShowLolipops: (show) => set({ showLolipops: show }),
}))

export default useStore;