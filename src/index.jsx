import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Seal from "./Seal.jsx";

function App() {
  const [value, setValue] = useState(0);
  return (
    <React.StrictMode>
      <Seal value={value} setValue={setValue} />
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
