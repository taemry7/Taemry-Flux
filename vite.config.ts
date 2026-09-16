import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: [
        { find: /^@\//, replacement: `${path.resolve(process.cwd(), 'src')}/` },
      ],
    },
    optimizeDeps: {
      include: [
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/analytics',
        '@firebase/app',
        '@firebase/auth',
        '@firebase/component',
      ],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: false,
      watch: null,
    },
  };
});
