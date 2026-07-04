import type { AvailabilityStatus } from '@tripcrew/shared';

// Participation accounting for scheduling/quorum (Feature 1 + Feature 10).
//
// - Opted-out members are always excluded from the effective member count
//   (they have bowed out) but remain visible to the group.
// - Non-responders (pending / no availability doc) are excluded from quorum
//   ONLY once the availability deadline has passed, so a few silent members
//   can't block the trip indefinitely. Before the deadline they still count.

export interface ParticipationInput {
    memberIds: string[];
    availabilities: { userId: unknown; status: AvailabilityStatus }[];
    availabilityDeadline: Date | null;
    now?: Date;
}

export interface ParticipationResult {
    /** Members who opted out (always excluded; surfaced to the UI). */
    optedOutIds: string[];
    /** Member count used for turnout/quorum after exclusions. */
    effectiveMemberCount: number;
}

export function computeParticipation({
    memberIds,
    availabilities,
    availabilityDeadline,
    now = new Date(),
}: ParticipationInput): ParticipationResult {
    const statusByUser = new Map<string, AvailabilityStatus>();
    for (const a of availabilities) statusByUser.set(String(a.userId), a.status);

    const deadlinePassed = availabilityDeadline ? now >= new Date(availabilityDeadline) : false;

    const optedOutIds: string[] = [];
    let effectiveMemberCount = 0;
    for (const rawId of memberIds) {
        const id = String(rawId);
        const status = statusByUser.get(id) ?? 'pending';
        if (status === 'opted_out') {
            optedOutIds.push(id);
            continue;
        }
        if (deadlinePassed && status !== 'submitted') continue;
        effectiveMemberCount++;
    }

    return { optedOutIds, effectiveMemberCount };
}
