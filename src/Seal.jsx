import "./Seal.css";
import React from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import Viewer from "./views/Viewer";
import LandingPage from "./views/LandingPage";
import Toolbar from "./views/Toolbar";
import useStore from "./store";

// Separate component for the dataset viewer to access URL params
function DatasetViewer({ isWidget, config,  height }) {
	console.log('config x', isWidget, config)
	const setDatasetId = useStore((state) => state.setDatasetId);
	if (isWidget) {
		setDatasetId(config.datasetId);
	} else {
		const { datasetId } = useParams();
		setDatasetId(datasetId);
	}

	return (
		<>
			<Toolbar />
			<Viewer config={config} height={height}/>

		</>
	);
}
const Seal = ({ value, setValue, height, config, isWidget }) => {
	console.log('config x', isWidget)
	return (
		<div className="Seal">
			{isWidget ? (
				<DatasetViewer isWidget={isWidget} config={config} height={height} />
			) : (
				<Router>
					<Routes>
						<Route path="/" element={<LandingPage />} />
						<Route path="/:datasetId" element={<DatasetViewer />} />
					</Routes>
				</Router>
			)}
		</div>
	);
};

export default Seal;