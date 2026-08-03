import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO: Update 'base' with your actual GitHub repo name before deploying
// e.g., if your repo is github.com/yourname/my-love-cards → base: '/my-love-cards/'
export default defineConfig({
  plugins: [react()],
  base: '/52-cards/',
  publicDir: 'playing-cards-assets',
})
