import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://jobvista-backend-f2zl.onrender.com', // Update with your EC2 instance's public IP address or domain name
        changeOrigin: true,
      },
    },
  },
})
