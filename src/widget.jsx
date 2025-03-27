import React from "react";
import Seal from "./Seal.jsx";
import { createRender, useModelState } from "@anywidget/react";
import "./index.css";

const render = createRender(() => {
	const [value, setValue] = useModelState("value");
	const [config, setConfig] = useModelState("config");
	console.log('xxx', config)

	return (
		<div id="widget" style={{ height: '600px', width: '100%'}}>
			<Seal value={value} setValue={setValue} height={'600'} config={config} />
		</div>
	);
});

export default { render };
