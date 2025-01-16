import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Seal from "./Seal.jsx";
import "./index.css";

function App() {
  const [value, setValue] = useState(0);
  return (
    <React.StrictMode>
      <div className="webapp">
        <Seal value={value} setValue={setValue} />
      </div>
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
