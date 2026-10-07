import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development (npm run dev) Vite runs on port 5173 and forwards
// /api calls to the backend. Change the port here if you change PORT in backend/.env.
const BACKEND_PORT = 5001;

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": `http://localhost:${BACKEND_PORT}`
        }
    }
});
