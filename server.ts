import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server-api";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // API Routes
  app.use("/api", apiRouter);

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve Vite in dev mode or built assets in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded via middleware.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production files from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OptiCrop AI server is active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
