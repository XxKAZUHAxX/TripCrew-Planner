import { Crown, Vote } from 'lucide-react';
import type { ArchetypeDefinitions, BadgeMap, UserRef } from '@tripcrew/shared';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import BadgeChip from './BadgeChip';

interface MembersListProps {
    members: UserRef[];
    creatorId: string | undefined;
    badges?: BadgeMap;
    definitions?: Partial<ArchetypeDefinitions>;
    /** Ids of members who have submitted a vote (Issue 10). */
    votedMemberIds?: string[];
    /** Ids of members who have opted out of the trip (Feature 1). */
    optedOutMemberIds?: string[];
}

export default function MembersList({
    members,
    creatorId,
    badges = {},
    definitions = {},
    votedMemberIds = [],
    optedOutMemberIds = [],
}: MembersListProps) {
    const voted = new Set(votedMemberIds);
    const optedOut = new Set(optedOutMemberIds);
    return (
        <ul className="space-y-2">
            {members.map((m) => {
                const memberBadges = badges[m._id] || [];
                const hasVoted = voted.has(m._id);
                const hasOptedOut = optedOut.has(m._id);
                return (
                    <li
                        key={m._id}
                        className={cn(
                            'rounded-lg border bg-card p-3',
                            hasOptedOut && 'opacity-60'
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 font-medium">
                                {m.name}
                                {hasVoted && (
                                    <Tooltip content="Has submitted a vote">
                                        <Vote
                                            className="size-3.5 text-success"
                                            aria-label="Has voted"
                                        />
                                    </Tooltip>
                                )}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {hasOptedOut && (
                                    <Badge variant="muted" className="gap-1">
                                        Opted out
                                    </Badge>
                                )}
                                {m._id === creatorId && (
                                    <Badge variant="secondary" className="gap-1">
                                        <Crown className="size-3" />
                                        Host
                                    </Badge>
                                )}
                            </div>
                        </div>
                        {memberBadges.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {memberBadges.map((b) => (
                                    <BadgeChip key={b} label={b} description={definitions[b]} />
                                ))}
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
