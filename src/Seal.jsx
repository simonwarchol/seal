import "./Seal.css";
import React from "react";
import Viewer from "./views/Viewer";
import sealLogo from "./public/SealLogo.svg";
const Seal = ({ value, setValue , height}) => {
	return (
		<div className="Seal">
			{/* Add logo absolute in top left */}
			<img src={sealLogo} style={{ position: 'absolute', top: 0, left: 10, height: '40px', width: 'auto', zIndex: 1000 }} />
			<Viewer value={value} setValue={setValue} height={height}/>
		</div>
	);
};

export default Seal;