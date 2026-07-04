/**
 * Domain types as they appear over the wire (JSON).
 *
 * These mirror the server's Mongoose documents AFTER serialization:
 *   - ObjectId fields become `string`
 *   - Date fields become ISO-8601 `string`
 *
 * The server's internal Mongoose interfaces (ITrip, IUser, ...) use ObjectId /
 * Date and intentionally differ from these transport shapes.
 */

export type TripStatus = 'voting' | 'decided' | 'archived';

/**
 * A member's availability response state:
 *  - `pending`   — has not responded yet
 *  - `submitted` — has marked their available dates
 *  - `opted_out` — has bowed out of the trip's scheduling entirely
 */
export type AvailabilityStatus = 'pending' | 'submitted' | 'opted_out';

export type ArchetypeName =
    'The Dictator' | 'The Ghost' | 'The Overthinker' | 'The Hype Machine';

/** The non-sensitive user shape returned by auth endpoints (`toSafeJSON`). */
export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

/** A user reference embedded in populated responses (members, creator). */
export interface UserRef {
    _id: string;
    name: string;
    email: string;
}

export interface Destination {
    _id: string;
    tripId: string;
    name: string;
    description: string;
    /** A raw id, or a populated reference when the endpoint populates it. */
    proposedBy: string | UserRef;
    /** Freeform per-person estimate in ₱, or null when not yet estimated. */
    estimatedCost: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface ChecklistTask {
    _id: string;
    label: string;
    createdBy: string;
    completedBy: string[];
    createdAt: string;
    updatedAt: string;
}

/** Full trip document (e.g. items in the "my trips" list). */
export interface Trip {
    _id: string;
    title: string;
    creator: string | UserRef;
    members: Array<string | UserRef>;
    inviteCode: string;
    inviteActive: boolean;
    status: TripStatus;
    startDate: string | null;
    endDate: string | null;
    votingDeadline: string | null;
    availabilityDeadline: string | null;
    winningDestination: string | Destination | null;
    instructions: string;
    playbookEditors: Array<string | UserRef>;
    checklistTemplates: ChecklistTask[];
    createdAt: string;
    updatedAt: string;
}

export interface Vote {
    _id: string;
    tripId: string;
    userId: string;
    ranking: string[];
    changeCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Availability {
    _id: string;
    tripId: string;
    userId: string;
    dates: string[];
    status: AvailabilityStatus;
    createdAt: string;
    updatedAt: string;
}

/** A destination with its computed Borda score (descending-sorted in lists). */
export interface ScoredDestination {
    destId: string;
    name: string;
    estimatedCost: number | null;
    score: number;
}

/** Deadlock evaluation surfaced to clients (dashboard + wheel status). */
export interface DeadlockStatus {
    eligible: boolean;
    tie: boolean;
    timeout: boolean;
    slices: ScoredDestination[];
}

/** userId -> earned archetype badge names. */
export type BadgeMap = Record<string, ArchetypeName[]>;

/** archetype name -> human-readable definition. */
export type ArchetypeDefinitions = Record<ArchetypeName, string>;

/** A heatmap: `YYYY-MM-DD` -> number of members free that day. */
export type Heatmap = Record<string, number>;

/** A checklist item with the caller's own completion state resolved. */
export interface ChecklistItem {
    id: string;
    label: string;
    createdBy?: string;
    completedByCount: number;
    completedByMe: boolean;
}
