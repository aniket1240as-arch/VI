import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const certPath = path.resolve(__dirname, 'certs/localhost-cert.pem');
const keyPath = path.resolve(__dirname, 'certs/localhost-key.pem');

const hasCert = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'auto-redirect-http-to-https',
      configureServer(server) {
        if (!hasCert) return;
        server.httpServer?.on('clientError', (err, socket) => {
          if (!socket.writable) return;
          if (
            err.code === 'ERR_SSL_PACKET_LENGTH_TOO_LONG' ||
            err.code === 'HPE_INVALID_METHOD' ||
            (err.message && err.message.toLowerCase().includes('packet length'))
          ) {
            socket.end(
              'HTTP/1.1 302 Found\r\nLocation: https://localhost:3000/\r\nConnection: close\r\n\r\n'
            );
          }
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    https: hasCert
      ? {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        }
      : false,
    watch: {
      ignored: ['**/backend/**', '**/reference_mockups/**', '**/certs/**'],
    },
    proxy: {
      '/api': {
        target: hasCert ? 'https://127.0.0.1:8000' : 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false, // dev self-signed certificate support
      },
    },
  },
});
