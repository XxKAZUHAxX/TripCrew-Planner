import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import tripRoutes from './routes/trips.routes.js';
import destinationRoutes from './routes/destinations.routes.js';
import voteRoutes from './routes/votes.routes.js';
import archetypeRoutes from './routes/archetypes.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import wheelRoutes from './routes/wheel.routes.js';
import playbookRoutes from './routes/playbook.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';

export function createApp(): Application {
    const app = express();

    app.use(
        cors({
            // Browser Origin headers never include a trailing slash, so strip one
            // from CLIENT_ORIGIN to avoid an exact-match CORS failure in production.
            origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/$/, ''),
            credentials: true,
        })
    );
    app.use(express.json());

    app.get('/api/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', time: new Date().toISOString() });
    });

    // Feature routers are mounted here as milestones are completed.
    app.use('/api/auth', authRoutes);
    app.use('/api/trips', tripRoutes);
    app.use('/api/trips/:tripId/destinations', destinationRoutes);
    app.use('/api/trips/:tripId', voteRoutes);
    app.use('/api/trips/:tripId', archetypeRoutes);
    app.use('/api/trips/:tripId/availability', availabilityRoutes);
    app.use('/api/trips/:tripId/wheel', wheelRoutes);
    app.use('/api/trips/:tripId/playbook', playbookRoutes);
    app.use('/api/maintenance', maintenanceRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}
