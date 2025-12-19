import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { store } from './store/store.ts'
import { OnboardingProvider } from './contexts/OnboardingContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <OnboardingProvider>
          <App />
        </OnboardingProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
