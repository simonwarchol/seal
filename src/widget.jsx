import * as React from "react";
import Seal from "./seal/seal.jsx";
import { createRender } from "@anywidget/react";

const render = createRender(() => {
	return (
		<Seal />
	);
});

export default { render };
