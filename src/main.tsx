import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App";
import { store } from "./Redux/Store";
import { logout, restoreSession } from "./Redux/authSlice";
import { registerAuthFailureHandler } from "./services/apiClient";

registerAuthFailureHandler(() => {
  store.dispatch(logout());
});

store.dispatch(restoreSession());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
