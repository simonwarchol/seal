import "./seal.css";
import React from "react";
const Seal = ({ value, setValue }) => {
	return (
		<div className="seal">
			<button onClick={() => setValue(value + 1)}>
				cnt on {value}
			</button>
		</div>
	);
};

export default Seal;