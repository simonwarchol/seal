import React from "react";
import Seal from "./Seal.jsx";
import { createRender, useModelState } from "@anywidget/react";
import "./index.css";
import useStore from "./store";
const render = createRender(() => {
	const [value, setValue] = useModelState("value");
	const [config, setConfig] = useModelState("config");
	const [server_url, set_server_url] = useModelState("server_url");
	console.log("server_url", server_url);
	const setServerUrl = useStore((state) => state.setServerUrl);
	setServerUrl(server_url);

	return (
		<div id="widget">
			<Seal value={value} setValue={setValue} config={config} isWidget={true} />
		</div>
	);
});

export default { render };
