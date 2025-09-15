import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryProvider } from '@/providers/QueryProvider'
import { LocationProvider } from '@/contexts/LocationContext'

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <LocationProvider>
      <App />
    </LocationProvider>
  </QueryProvider>
);
