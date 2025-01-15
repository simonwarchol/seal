import * as React from "react";
import { createRender, useModelState } from "@anywidget/react";
import "./seal.css";

const render = createRender(() => {
	const [value, setValue] = useModelState("value");
	return (
		<div className="seal">
			<button onClick={() => setValue(value + 1)}>
				count iss_____st {value}
			</button>
		</div>
	);
});

export default { render };
