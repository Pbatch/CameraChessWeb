import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store.tsx';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { registerSW } from 'virtual:pwa-register';
import { VideoAndSidebar } from './components/common';
import App from './App';
import Home from './components/home/home';
import Export from './components/export/export';
import Privacy from './components/privacy/privacy';
import FAQ from './components/faq/faq';
import './style/index.css';

// add this to prompt for a refresh
const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
});

const router = createBrowserRouter();

const RootRoutes = (
  <Routes>
    <Route path="/" element={<App />}>
      <Route path="" element={<Home />} />
      <Route path="/record" element={<VideoAndSidebar mode="record" />} />
      <Route path="/upload" element={<VideoAndSidebar mode="upload" />} />
      <Route path="/broadcast" element={<VideoAndSidebar mode="broadcast" />} />
      <Route path="/export" element={<Export />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/faq" element={<FAQ />} />
    </Route>
  </Routes>
);

const root = createRoot(document.getElementById('root')!);
const persistor = persistStore(store);

root.render(
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <RouterProvider router={router}>{RootRoutes}</RouterProvider>
    </PersistGate>
  </Provider>
);
