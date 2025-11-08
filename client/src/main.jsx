import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider, useSelector } from 'react-redux'
import store from './store/store'

const ThemeEffect = () => {
  const theme = useSelector((state) => state.theme.theme)
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme)
    } catch {}
    document.documentElement.setAttribute('data-theme', theme)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff')
    }
  }, [theme])
  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
      <ThemeEffect />
      <App />
    </Provider>
)
