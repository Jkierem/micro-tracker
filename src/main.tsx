import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './support/style/css/reset.css'
import './support/style/css/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
