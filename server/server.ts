import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function start(): Promise<void> {
    try {
        await connectDB(process.env.MONGODB_URI);
        const app = createApp();
        app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Failed to start server:', message);
        process.exit(1);
    }
}

start();
