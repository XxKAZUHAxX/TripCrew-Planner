/**
 * API request and response contracts for every endpoint under `/api`.
 *
 * All routes are prefixed with `/api`. Authenticated routes expect:
 *   Authorization: Bearer <jwt>
 */
import type {
    ArchetypeDefinitions,
    Availability,
    BadgeMap,
    BudgetTier,
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
}

export type UpdateTripRequest = Partial<CreateTripRequest>;

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

// --- Destinations: /api/trips/:tripId/destinations ---------------------------

export interface ProposeDestinationRequest {
    name: string;
    description?: string;
    budgetTier?: BudgetTier;
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
}

// --- Availability: /api/trips/:tripId/availability ---------------------------

export interface SaveAvailabilityRequest {
    /** UTC `YYYY-MM-DD` strings. */
    dates: string[];
}

export interface SaveAvailabilityResponse {
    availability: Availability;
}

export interface MyAvailabilityResponse {
    dates: string[];
}

export type HeatmapResponse = Heatmap;

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
