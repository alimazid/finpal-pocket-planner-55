import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "next-themes"
import App from './App.tsx'
import './index.css'

// Validate required environment variables
const requiredEnvVars = ['VITE_API_URL', 'VITE_WEBHOOK_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
