/**
 * API request and response contracts for every endpoint under `/api`.
 *
 * All routes are prefixed with `/api`. Authenticated routes expect:
 *   Authorization: Bearer <jwt>
 */
import type {
    ArchetypeDefinitions,
    Availability,
    AvailabilityStatus,
    BadgeMap,
    ChecklistItem,
    DeadlockStatus,
    Destination,
    Heatmap,
    ScoredDestination,
    Trip,
    TripStatus,
    User,
    UserRef,
    Vote,
} from './domain.js';

/** Standard error body returned by the centralized error handler. */
export interface ApiError {
    message: string;
}

// --- Auth: /api/auth ---------------------------------------------------------

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Passwordless-recovery identity check (Feature 3): no email is sent. The user
 * proves ownership by matching the stored name + email exactly.
 */
export interface ResetPasswordRequest {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface MeResponse {
    user: User;
}

// --- Trips: /api/trips -------------------------------------------------------

export interface CreateTripRequest {
    title: string;
    /** ISO-8601 date strings. */
    startDate?: string | null;
    endDate?: string | null;
    votingDeadline?: string | null;
    /** Must be on or after votingDeadline when both are set. */
    availabilityDeadline?: string | null;
}

export type UpdateTripRequest = Partial<CreateTripRequest>;

/** Grant playbook edit rights to the given members (creator-only). */
export interface UpdatePlaybookEditorsRequest {
    editorIds: string[];
}

export interface ToggleInviteRequest {
    inviteActive: boolean;
}

export interface CreateTripResponse {
    trip: Trip;
}

export interface ListTripsResponse {
    trips: Trip[];
}

export interface TripDetailResponse {
    trip: Trip;
    members: UserRef[];
    destinations: Destination[];
}

export interface TripResponse {
    trip: Trip;
}

/** Lightweight, membership-free preview of a trip from an invite code. */
export interface TripPreviewResponse {
    title: string;
    memberCount: number;
    alreadyMember: boolean;
    inviteActive: boolean;
}

/** Result of concluding voting (manually by host or auto after deadline). */
export interface ConcludeResponse {
    status: TripStatus;
    /** Present when a clear winner was determined. */
    winningDestinationId?: string;
    /** True when the result is a tie/deadlock and the Wheel is required. */
    wheel: boolean;
    deadlock: DeadlockStatus;
}

// --- Destinations: /api/trips/:tripId/destinations ---------------------------

export interface ProposeDestinationRequest {
    name: string;
    description?: string;
    /** Optional per-person estimate in ₱; non-negative or null. */
    estimatedCost?: number | null;
}

/** Edit a destination's mutable fields (Feature 7). */
export interface UpdateDestinationRequest {
    estimatedCost?: number | null;
}

export interface DestinationResponse {
    destination: Destination;
}

export interface ListDestinationsResponse {
    destinations: Destination[];
}

// --- Votes: /api/trips/:tripId -----------------------------------------------

export interface SubmitVoteRequest {
    /** Ordered destination ids; index 0 = first choice. */
    ranking: string[];
}

export interface VoteResponse {
    vote: Vote;
}

export interface MyVoteResponse {
    vote: Vote | null;
}

export interface TallyResponse {
    scores: ScoredDestination[];
}

// --- Dashboard / archetypes: /api/trips/:tripId ------------------------------

export interface ArchetypesResponse {
    badges: BadgeMap;
    definitions: ArchetypeDefinitions;
}

export interface DashboardResponse {
    scores: ScoredDestination[];
    badges: BadgeMap;
    definitions: ArchetypeDefinitions;
    deadlock: DeadlockStatus;
    status: TripStatus;
    memberCount: number;
    voterCount: number;
    /** Ids of members who have submitted a vote. */
    votedMemberIds: string[];
    /** Ids of members who have opted out of this trip's scheduling (Feature 1). */
    optedOutMemberIds: string[];
}

// --- Availability: /api/trips/:tripId/availability ---------------------------

export interface SaveAvailabilityRequest {
    /** UTC `YYYY-MM-DD` strings. */
    dates: string[];
}

export interface SaveAvailabilityResponse {
    availability: Availability;
}

/** Result of opting in/out of a trip's scheduling (Feature 1). */
export interface OptOutResponse {
    availability: Availability;
}

export interface MyAvailabilityResponse {
    dates: string[];
    status: AvailabilityStatus;
}

export type HeatmapResponse = Heatmap;

/** A member who is available on a given date. */
export interface AvailabilityMember {
    id: string;
    name: string;
}

/** One date and the members free on it (used by the "best dates" panel). */
export interface AvailabilitySummaryEntry {
    date: string;
    members: AvailabilityMember[];
}

export interface AvailabilitySummaryResponse {
    memberCount: number;
    /** Sorted by availability count descending; only dates with >= 1 member. */
    entries: AvailabilitySummaryEntry[];
}

// --- Wheel of Destiny: /api/trips/:tripId/wheel ------------------------------

export interface WheelStatusResponse {
    eligible: boolean;
    tie: boolean;
    timeout: boolean;
    slices: ScoredDestination[];
    status: TripStatus;
}

export interface SpinResponse {
    winningDestinationId: string;
    winnerIndex: number;
    slices: ScoredDestination[];
    status: TripStatus;
}

// --- Playbook: /api/trips/:tripId/playbook -----------------------------------

export interface UpdateInstructionsRequest {
    instructions: string;
}

export interface AddTaskRequest {
    label: string;
}

export interface PlaybookResponse {
    instructions: string;
    winningDestination: Destination | null;
    checklist: ChecklistItem[];
}

export interface UpdateInstructionsResponse {
    instructions: string;
}

export interface AddTaskResponse {
    task: Pick<ChecklistItem, 'id' | 'label'> & { createdBy: string };
}

export interface ToggleTaskResponse {
    task: ChecklistItem;
}

export interface OkResponse {
    ok: true;
}
