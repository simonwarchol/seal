import { useState } from "react";

import "./seal.css";
import { useModelState } from "@anywidget/react";




const Seal = () => {
	const [value, setValue] = useState(0);
	return (
		<div className="seal">
			poop
			<button onClick={() => setValue(value + 1)}>
				c098899890ount ok {value}
			</button>
		</div>
	);
};

export default Seal;