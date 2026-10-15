import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import './styles/global.css';
import './styles/shop.css';
import './styles/admin.css';
import { enableSourceProtection } from './protect.js';

// Live site only, so local development keeps devtools.
if (import.meta.env.PROD) enableSourceProtection();

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <CartProvider>
      <App />
    </CartProvider>
  </BrowserRouter>
);
