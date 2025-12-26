import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from 'react-redux';
import { store } from './store';
import App from "./App.tsx";
import { registerPWA } from './pwa-register'


import "./index.css";

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </Provider>
  </React.StrictMode>
);

registerPWA()