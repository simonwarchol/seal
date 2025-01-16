import React from "react";
import Seal from "./Seal.jsx";
import { createRender, useModelState } from "@anywidget/react";
import "./index.css";

const render = createRender(() => {
	const [value, setValue] = useModelState("value");

	return (
		<div id="widget">
			<Seal value={value} setValue={setValue} />
		</div>
	);
});

export default { render };
