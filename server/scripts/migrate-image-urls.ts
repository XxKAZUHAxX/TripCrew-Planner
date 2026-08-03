import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';
import Destination from '../models/Destination.js';

// Some local ISPs/networks fail to resolve mongodb+srv:// SRV records via
// their default resolver (seen here alongside the same issue with r2.dev).
// Force a public resolver for this one-off script so it isn't affected.
dns.setServers(['1.1.1.1', '8.8.8.8']);

// One-off migration: rewrites Destination.images[].url from the old base URL
// (e.g. the r2.dev public URL) to the new base URL (e.g. the image-worker's
// workers.dev URL), using the already-stored `key` to rebuild each URL.
// Run this once after cutting R2_PUBLIC_BASE_URL over to the new domain.
//
// Usage:
//   tsx scripts/migrate-image-urls.ts <oldBaseUrl> <newBaseUrl>
async function main(): Promise<void> {
    const [oldBaseArg, newBaseArg] = process.argv.slice(2);
    if (!oldBaseArg || !newBaseArg) {
        console.error('Usage: tsx scripts/migrate-image-urls.ts <oldBaseUrl> <newBaseUrl>');
        process.exit(1);
    }
    const oldBase = oldBaseArg.replace(/\/$/, '');
    const newBase = newBaseArg.replace(/\/$/, '');

    await mongoose.connect(process.env.MONGODB_URI as string);

    const destinations = await Destination.find({ 'images.0': { $exists: true } });
    let updatedDestinations = 0;
    let updatedImages = 0;

    for (const destination of destinations) {
        let changed = false;
        for (const image of destination.images) {
            if (image.url.startsWith(oldBase)) {
                image.url = `${newBase}/${image.key}`;
                changed = true;
                updatedImages += 1;
            }
        }
        if (changed) {
            await destination.save();
            updatedDestinations += 1;
        }
    }

    console.log(
        `Updated ${updatedImages} image URL(s) across ${updatedDestinations} destination(s).`
    );
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
