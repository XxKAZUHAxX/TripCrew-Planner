import express from "express";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import tripRoutes from "./routes/trips.routes.js";
import destinationRoutes from "./routes/destinations.routes.js";
import voteRoutes from "./routes/votes.routes.js";
import archetypeRoutes from "./routes/archetypes.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";

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
    app.use("/api/trips", tripRoutes);
    app.use("/api/trips/:tripId/destinations", destinationRoutes);
    app.use("/api/trips/:tripId", voteRoutes);
    app.use("/api/trips/:tripId", archetypeRoutes);
    app.use("/api/trips/:tripId/availability", availabilityRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}
