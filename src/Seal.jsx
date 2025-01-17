import "./Seal.css";
import React from "react";
import Viewer from "./views/Viewer";
import sealLogo from "./public/SealLogo.svg";
const Seal = ({ value, setValue , height}) => {
	return (
		<div className="Seal">
			{/* Add logo absolute in top left */}
			<img src={sealLogo} style={{ position: 'absolute', bottom: 0, left: 0, height: '100px', width: 'auto', zIndex: 1000 }} />
			<Viewer value={value} setValue={setValue} height={height}/>
		</div>
	);
};

export default Seal;