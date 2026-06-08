import React from "react";
import ReactDOM from "react-dom/client";

import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";

import "./index.css";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ToastProvider } from "./context/ToastContext";  // ✅ import ToastProvider

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <SocketProvider>
      <ToastProvider>   {/* ✅ wrap App with ToastProvider */}
        <App />
      </ToastProvider>
    </SocketProvider>
  </AuthProvider>,
);