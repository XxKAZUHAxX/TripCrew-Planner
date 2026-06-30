import type { TripDocument } from '../models/Trip.js';

// The authenticated principal extracted from the JWT by `requireAuth`.
export interface AuthUser {
    id: string;
    email: string;
}

// Augment Express's Request with the properties our middleware attaches.
// `user` is set by requireAuth; `trip` is set by requireMembership. They are
// declared as required because the middleware chain guarantees their presence
// before any controller that relies on them runs.
declare global {
    namespace Express {
        interface Request {
            user: AuthUser;
            trip: TripDocument;
        }
    }
}

export {};
