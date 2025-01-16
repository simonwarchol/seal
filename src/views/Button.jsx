import "./Button.css";
import React from "react";
const Button = ({ value, setValue }) => {
    return (
        <button onClick={() => setValue(value + 1)}>
            SSsseall on {value}
        </button>
    );
};

export default Button;