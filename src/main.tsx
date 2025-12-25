import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import { store } from "./frontend/store/store";
import App from "./frontend/App";

const root = createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>
);
