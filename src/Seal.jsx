import "./Seal.css";
import React from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import Viewer from "./views/Viewer";
import LandingPage from "./views/LandingPage";
import Toolbar from "./views/Toolbar";
import useStore from "./store";

// Separate component for the dataset viewer to access URL params
function DatasetViewer() {
	const { datasetId } = useParams();
	const setDatasetId = useStore((state) => state.setDatasetId);
	setDatasetId(datasetId);
	return (
		<>
			<Toolbar />
			<Viewer />

		</>
	);
}
const Seal = ({ value, setValue, height, config }) => {
	return (
		<div className="Seal">
			<Router>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/:datasetId" element={<DatasetViewer />} />
				</Routes>
			</Router>
		</div>
	);
};

export default Seal;