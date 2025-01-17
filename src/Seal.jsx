import "./Seal.css";
import React from "react";
import Viewer from "./views/Viewer";
const Seal = ({ value, setValue , height}) => {
	return (
		<div className="Seal">
			<Viewer value={value} setValue={setValue} height={height}/>
		</div>
	);
};

export default Seal;