import React from "react";
import Seal from "./Seal.jsx";
import { createRender, useModelState } from "@anywidget/react";
import "./index.css";

const render = createRender(() => {
	const [value, setValue] = useModelState("value");

	return (
		<div style={{ height: '600px', width: '600px' }}>
			<Seal value={value} setValue={setValue} height={'600'} />
		</div>
	);
});

export default { render };
