import { create } from 'zustand'

const useStore = create((set) => ({
    lockedChannels: [],
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
    setSetFeatures: (features) => set({ setFeatures: features }),
    hoveredClusters: {},
    setHoveredClusters: (clusters) => set({ hoveredClusters: clusters }),
    hoverClusterOpacities: {},
    setHoverClusterOpacities: (opacities) => set({ hoverClusterOpacities: opacities }),
    showClusterOutlines: true,
    setShowClusterOutlines: (show) => set({ showClusterOutlines: show }),
    showClusterTitles: true,
    setShowClusterTitles: (show) => set({ showClusterTitles: show }),
    hoveredCluster: null,
    setHoveredCluster: (cluster) => set({ hoveredCluster: cluster }),

    selectedBackground: 'show',
    setSelectedBackground: (background) => set({ selectedBackground: background }),
    selectedSelection: 'spotlight',
    setSelectedSelection: (selection) => set({ selectedSelection: selection }),
}))

export default useStore;