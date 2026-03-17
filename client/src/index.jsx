import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "./context/ThemeContext";
import { AcademicProvider } from './context/AcademicContext';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AcademicProvider>
        <App />
      </AcademicProvider>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();