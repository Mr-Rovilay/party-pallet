import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import Store from "./redux/store.js";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={Store}>
      <TooltipProvider>
        <BrowserRouter>
            <Toaster position="top-right" expand={true} richColors />
          <App />
        </BrowserRouter>
      </TooltipProvider>
    </Provider>
  </StrictMode>
);
