import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: 'https://rivero205.github.io/frontend_gametrack/',
  plugins: [react()],
})
