import express from "express";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
            credentials: true,
        }),
    );
    app.use(express.json());

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", time: new Date().toISOString() });
    });

    // Feature routers are mounted here as milestones are completed.
    app.use("/api/auth", authRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}
