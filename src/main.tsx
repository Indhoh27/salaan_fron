import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App";
import { store } from "./Redux/Store";
import { logout } from "./Redux/authSlice";
import { registerAuthFailureHandler } from "./services/apiClient";

registerAuthFailureHandler(() => {
  store.dispatch(logout());
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
