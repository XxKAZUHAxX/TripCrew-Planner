import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Destination from '../models/Destination.js';
import {
    isStorageConfigured,
    uploadImage,
    deleteImage as removeImageObject,
} from '../config/storage.js';

// Validates a freeform estimated cost: null clears it, otherwise a finite
// non-negative number. Returns true when the value is acceptable.
function isValidCost(value: unknown): value is number | null {
    return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

const MAX_LINKS = 10;
const MAX_TAGS = 12;
const MAX_TAG_LEN = 30;

// Accepts only well-formed http(s) URLs so we never persist javascript:/data:
// URIs that could later be rendered as clickable links (XSS defense).
function sanitizeLinks(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    for (const raw of value) {
        if (typeof raw !== 'string') continue;
        const trimmed = raw.trim();
        if (!trimmed) continue;
        try {
            const url = new URL(trimmed);
            if (url.protocol === 'http:' || url.protocol === 'https:') out.push(url.toString());
        } catch {
            // Skip anything that isn't an absolute URL.
        }
        if (out.length >= MAX_LINKS) break;
    }
    return out;
}

function sanitizeTags(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of value) {
        if (typeof raw !== 'string') continue;
        const tag = raw.trim().slice(0, MAX_TAG_LEN);
        const key = tag.toLowerCase();
        if (!tag || seen.has(key)) continue;
        seen.add(key);
        out.push(tag);
        if (out.length >= MAX_TAGS) break;
    }
    return out;
}

// A valid pin is null (clears it) or a {lat,lng} pair within earth's bounds.
function isValidLocation(value: unknown): value is { lat: number; lng: number } | null {
    if (value === null) return true;
    if (typeof value !== 'object') return false;
    const { lat, lng } = value as Record<string, unknown>;
    return (
        typeof lat === 'number' &&
        Number.isFinite(lat) &&
        lat >= -90 &&
        lat <= 90 &&
        typeof lng === 'number' &&
        Number.isFinite(lng) &&
        lng >= -180 &&
        lng <= 180
    );
}

// Re-fetches a destination with author references populated for API responses.
async function populated(id: Types.ObjectId | string) {
    return Destination.findById(id)
        .populate('proposedBy', 'name email')
        .populate('comments.userId', 'name email')
        .populate('images.uploadedBy', 'name email');
}

export async function proposeDestination(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, description, estimatedCost } = req.body;
        if (!name) {
            res.status(400).json({ message: 'name is required' });
            return;
        }
        if (req.trip.status !== 'voting') {
            res.status(403).json({ message: 'Destination proposals are closed for this trip.' });
            return;
        }
        if (estimatedCost !== undefined && !isValidCost(estimatedCost)) {
            res.status(400).json({
                message: 'estimatedCost must be a non-negative number or null',
            });
            return;
        }
        const destination = await Destination.create({
            tripId: req.trip._id,
            name,
            description: description || '',
            estimatedCost: estimatedCost === undefined ? null : estimatedCost,
            proposedBy: new Types.ObjectId(req.user.id),
        });
        res.status(201).json({ destination });
    } catch (err) {
        next(err);
    }
}

// Edit a destination. Cost edits (Feature 7) stay gated to the proposer or the
// trip creator; the collaborative details (notes/links/tags, Feature 4) may be
// edited by any trip member so everyone can help make the case.
export async function updateDestination(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { estimatedCost, notes, links, tags, location } = req.body;
        if (estimatedCost !== undefined && !isValidCost(estimatedCost)) {
            res.status(400).json({
                message: 'estimatedCost must be a non-negative number or null',
            });
            return;
        }
        if (notes !== undefined && typeof notes !== 'string') {
            res.status(400).json({ message: 'notes must be a string' });
            return;
        }
        if (location !== undefined && !isValidLocation(location)) {
            res.status(400).json({ message: 'location must be a valid {lat,lng} pair or null' });
            return;
        }
        const destination = await Destination.findOne({
            _id: req.params.id,
            tripId: req.trip._id,
        });
        if (!destination) {
            res.status(404).json({ message: 'Destination not found' });
            return;
        }
        if (estimatedCost !== undefined) {
            const isProposer = destination.proposedBy.equals(req.user.id);
            const isCreator = req.trip.isCreator(req.user.id);
            if (!isProposer && !isCreator) {
                res.status(403).json({
                    message: 'Only the proposer or trip creator can edit the cost',
                });
                return;
            }
            destination.estimatedCost = estimatedCost;
        }
        if (notes !== undefined) destination.notes = notes;
        if (links !== undefined) destination.links = sanitizeLinks(links);
        if (tags !== undefined) destination.tags = sanitizeTags(tags);
        if (location !== undefined) destination.location = location;
        await destination.save();
        res.json({ destination: await populated(destination._id) });
    } catch (err) {
        next(err);
    }
}

// Any trip member may add a comment (Feature 4).
export async function addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string' || !text.trim()) {
            res.status(400).json({ message: 'Comment text is required' });
            return;
        }
        const destination = await Destination.findOne({
            _id: req.params.id,
            tripId: req.trip._id,
        });
        if (!destination) {
            res.status(404).json({ message: 'Destination not found' });
            return;
        }
        destination.comments.push({
            userId: new Types.ObjectId(req.user.id),
            text: text.trim().slice(0, 1000),
        });
        await destination.save();
        res.status(201).json({ destination: await populated(destination._id) });
    } catch (err) {
        next(err);
    }
}

// The comment author or the trip creator may delete a comment (Feature 4).
export async function deleteComment(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const destination = await Destination.findOne({
            _id: req.params.id,
            tripId: req.trip._id,
        });
        if (!destination) {
            res.status(404).json({ message: 'Destination not found' });
            return;
        }
        const comment = destination.comments.id(req.params.commentId!);
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }
        const isAuthor = comment.userId.equals(req.user.id);
        const isCreator = req.trip.isCreator(req.user.id);
        if (!isAuthor && !isCreator) {
            res.status(403).json({
                message: 'Only the comment author or trip creator can delete it',
            });
            return;
        }
        comment.deleteOne();
        await destination.save();
        res.json({ destination: await populated(destination._id) });
    } catch (err) {
        next(err);
    }
}

// Any trip member may upload photos, during or after voting (Feature 6). The
// multer middleware has already validated type/size and populated req.files.
export async function uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!isStorageConfigured()) {
            res.status(503).json({
                message: 'Photo uploads are not configured on this server.',
            });
            return;
        }
        const files = (req.files as Express.Multer.File[] | undefined) ?? [];
        if (files.length === 0) {
            res.status(400).json({ message: 'No image files provided' });
            return;
        }
        const destination = await Destination.findOne({
            _id: req.params.id,
            tripId: req.trip._id,
        });
        if (!destination) {
            res.status(404).json({ message: 'Destination not found' });
            return;
        }
        for (const file of files) {
            const stored = await uploadImage(
                destination._id.toString(),
                file.buffer,
                file.mimetype
            );
            destination.images.push({
                url: stored.url,
                key: stored.key,
                uploadedBy: new Types.ObjectId(req.user.id),
            });
        }
        await destination.save();
        res.status(201).json({ destination: await populated(destination._id) });
    } catch (err) {
        next(err);
    }
}

// The uploader or the trip creator may delete a photo (Feature 6).
export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const destination = await Destination.findOne({
            _id: req.params.id,
            tripId: req.trip._id,
        });
        if (!destination) {
            res.status(404).json({ message: 'Destination not found' });
            return;
        }
        const image = destination.images.id(req.params.imageId!);
        if (!image) {
            res.status(404).json({ message: 'Image not found' });
            return;
        }
        const isUploader = image.uploadedBy.equals(req.user.id);
        const isCreator = req.trip.isCreator(req.user.id);
        if (!isUploader && !isCreator) {
            res.status(403).json({
                message: 'Only the uploader or trip creator can delete this photo',
            });
            return;
        }
        if (isStorageConfigured()) {
            // Best-effort: a failed object delete shouldn't block removing the ref.
            try {
                await removeImageObject(image.key);
            } catch {
                /* ignore storage errors */
            }
        }
        image.deleteOne();
        await destination.save();
        res.json({ destination: await populated(destination._id) });
    } catch (err) {
        next(err);
    }
}

export async function listDestinations(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const destinations = await Destination.find({ tripId: req.trip._id })
            .populate('proposedBy', 'name email')
            .populate('comments.userId', 'name email')
            .sort({ createdAt: 1 });
        res.json({ destinations });
    } catch (err) {
        next(err);
    }
}

export async function deleteDestination(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const destination = await Destination.findOne({
            _id: req.params.id,
            tripId: req.trip._id,
        });
        if (!destination) {
            res.status(404).json({ message: 'Destination not found' });
            return;
        }
        // Only the proposer or the trip creator may delete.
        const isProposer = destination.proposedBy.equals(req.user.id);
        const isCreator = req.trip.isCreator(req.user.id);
        if (!isProposer && !isCreator) {
            res.status(403).json({ message: 'Only the proposer or trip creator can delete this' });
            return;
        }
        await destination.deleteOne();
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}
