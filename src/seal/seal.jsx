import * as React from "react";
import "./seal.css";




const Seal = ({value, setValue}) => {
	return (
		<div className="seal">
			<button onClick={() => setValue(value + 1)}>
				count on {value}
			</button>
		</div>
	);
};

export default Seal;