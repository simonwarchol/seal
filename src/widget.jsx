import React from "react";
import Seal from "./Seal.jsx";
import { createRender, useModelState } from "@anywidget/react";

const render = createRender(() => {
	const [value, setValue] = useModelState("value");

	return (
		<Seal value={value} setValue={setValue} height={'600'} />
	);
});

export default { render };
