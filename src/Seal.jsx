import "./Seal.css";
import React from "react";
import Viewer from "./views/Viewer";
import Toolbar from "./views/Toolbar";
const Seal = ({ value, setValue, height, config }) => {
	return (
		<div className="Seal">
			{/* Add logo absolute in top left */}
			<Toolbar />
			<Viewer value={value} setValue={setValue} height={height} config={config} />
		</div>
	);
};

export default Seal;