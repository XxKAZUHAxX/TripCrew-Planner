import { Crown, Vote } from 'lucide-react';
import type { ArchetypeDefinitions, BadgeMap, UserRef } from '@tripcrew/shared';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import BadgeChip from './BadgeChip';

interface MembersListProps {
    members: UserRef[];
    creatorId: string | undefined;
    badges?: BadgeMap;
    definitions?: Partial<ArchetypeDefinitions>;
    /** Ids of members who have submitted a vote (Issue 10). */
    votedMemberIds?: string[];
}

export default function MembersList({
    members,
    creatorId,
    badges = {},
    definitions = {},
    votedMemberIds = [],
}: MembersListProps) {
    const voted = new Set(votedMemberIds);
    return (
        <ul className="space-y-2">
            {members.map((m) => {
                const memberBadges = badges[m._id] || [];
                const hasVoted = voted.has(m._id);
                return (
                    <li key={m._id} className="rounded-lg border bg-card p-3">
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
                            {m._id === creatorId && (
                                <Badge variant="secondary" className="gap-1">
                                    <Crown className="size-3" />
                                    Host
                                </Badge>
                            )}
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
