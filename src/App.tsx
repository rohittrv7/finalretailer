import { createRoot } from "react-dom/client";
import Main from "./frontend/Main";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./frontend/store/store";

const root = createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <Main />
  </Provider>
);
