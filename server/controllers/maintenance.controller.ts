import type { Request, Response, NextFunction } from 'express';
import { runDataCleanup } from '../utils/maintenance.js';

// Feature 8: triggers the stale-data cleanup pass on demand. Since the app
// scales to zero (Fly.io min_machines_running=0) a persistent in-process cron
// can't be relied on — instead this endpoint is meant to be hit periodically
// by an external scheduler (e.g. a GitHub Actions cron workflow), guarded by
// a shared secret so it can't be triggered by anyone else.
export async function triggerCleanup(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const secret = process.env.MAINTENANCE_SECRET;
        if (!secret) {
            res.status(503).json({
                message: 'Maintenance endpoint is not configured on this server.',
            });
            return;
        }
        if (req.header('x-maintenance-key') !== secret) {
            res.status(403).json({ message: 'Invalid maintenance key' });
            return;
        }
        const summary = await runDataCleanup();
        res.json({ ok: true, ...summary });
    } catch (err) {
        next(err);
    }
}
