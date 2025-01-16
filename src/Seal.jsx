import "./Seal.css";
import React from "react";
import Viewer from "./views/Viewer";
const Seal = ({ value, setValue }) => {
	return (
		<div className="Seal">
			<Viewer value={value} setValue={setValue} />
		</div>
	);
};

export default Seal;