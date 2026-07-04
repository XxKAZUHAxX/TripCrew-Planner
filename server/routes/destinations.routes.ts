import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMembership } from '../middleware/trip.middleware.js';
import { ALLOWED_IMAGE_MIMES, MAX_IMAGE_BYTES } from '../config/storage.js';
import {
    proposeDestination,
    listDestinations,
    deleteDestination,
    updateDestination,
    addComment,
    deleteComment,
    uploadImages,
    deleteImage,
} from '../controllers/destinations.controller.js';

// Mounted at /api/trips/:tripId/destinations
const router = Router({ mergeParams: true });

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 5 },
    fileFilter(_req, file, cb) {
        cb(null, ALLOWED_IMAGE_MIMES.includes(file.mimetype));
    },
});

// Wrap multer so type/size violations surface as clean 400s instead of 500s.
function uploadImagesMw(req: Request, res: Response, next: NextFunction): void {
    upload.array('images', 5)(req, res, (err: unknown) => {
        if (err) {
            const message =
                err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
                    ? 'Each image must be 5 MB or smaller'
                    : err instanceof Error
                      ? err.message
                      : 'Upload failed';
            res.status(400).json({ message });
            return;
        }
        next();
    });
}

router.post('/', requireAuth, requireMembership, proposeDestination);
router.get('/', requireAuth, requireMembership, listDestinations);
router.patch('/:id', requireAuth, requireMembership, updateDestination);
router.delete('/:id', requireAuth, requireMembership, deleteDestination);
router.post('/:id/comments', requireAuth, requireMembership, addComment);
router.delete('/:id/comments/:commentId', requireAuth, requireMembership, deleteComment);
router.post('/:id/images', requireAuth, requireMembership, uploadImagesMw, uploadImages);
router.delete('/:id/images/:imageId', requireAuth, requireMembership, deleteImage);

export default router;
