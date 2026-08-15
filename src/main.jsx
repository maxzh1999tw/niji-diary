import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const isNijiCloudflareSite =
  window.location.hostname === 'mia-and-max.com' ||
  window.location.hostname === 'niji.mia-and-max.com' ||
  window.location.hostname === 'niji-diary.pages.dev' ||
  window.location.hostname.endsWith('.niji-diary.pages.dev')

if (import.meta.env.PROD && isNijiCloudflareSite && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('無法啟用離線模式', error)
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
