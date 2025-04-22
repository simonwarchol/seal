import React from "react";
import Seal from "./Seal.jsx";
import { createRender, useModelState } from "@anywidget/react";
import "./index.css";

const render = createRender(() => {
	const [value, setValue] = useModelState("value");
	const [config, setConfig] = useModelState("config");

	return (
		<div id="widget">
			<Seal value={value} setValue={setValue} config={config} isWidget={true} />
		</div>
	);
});

export default { render };
