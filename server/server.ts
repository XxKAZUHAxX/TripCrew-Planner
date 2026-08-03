import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { runDataCleanup } from './utils/maintenance.js';

const PORT = process.env.PORT || 5000;

async function start(): Promise<void> {
    try {
        await connectDB(process.env.MONGODB_URI);
        const app = createApp();
        app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
        });
        // Best-effort stale-data sweep (Feature 8) — never blocks startup.
        runDataCleanup().catch((err) => {
            console.error('Startup data cleanup failed:', err instanceof Error ? err.message : err);
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Failed to start server:', message);
        process.exit(1);
    }
}

start();
