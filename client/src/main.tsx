import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error('⚠️ Missing VITE_CLERK_PUBLISHABLE_KEY in .env file')
  console.error('Please add: VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#010101',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Configuration Error</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Missing Clerk Publishable Key</p>
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '20px', 
          borderRadius: '8px',
          maxWidth: '600px',
          textAlign: 'left'
        }}>
          <p style={{ marginBottom: '1rem' }}>Please add the following to your <code>.env</code> file in the <code>client/</code> directory:</p>
          <pre style={{ 
            backgroundColor: '#000', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
          </pre>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
            Get your key from: <a href="https://dashboard.clerk.com" target="_blank" style={{ color: '#009BE9' }}>Clerk Dashboard</a>
          </p>
        </div>
      </div>
    )}
  </StrictMode>,
)

