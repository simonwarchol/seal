import React from "react";
import Seal from "./components/seal.jsx";
import { createRender, useModelState } from "@anywidget/react";

const render = createRender(() => {
	const [value, setValue] = useModelState("value");

	return (
		<Seal value={value} setValue={setValue} />
	);
});

export default { render };
