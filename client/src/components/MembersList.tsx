import { Crown } from 'lucide-react';
import type { ArchetypeDefinitions, BadgeMap, UserRef } from '@tripcrew/shared';
import { Badge } from '@/components/ui/badge';
import BadgeChip from './BadgeChip';

interface MembersListProps {
    members: UserRef[];
    creatorId: string | undefined;
    badges?: BadgeMap;
    definitions?: Partial<ArchetypeDefinitions>;
}

export default function MembersList({
    members,
    creatorId,
    badges = {},
    definitions = {},
}: MembersListProps) {
    return (
        <ul className="space-y-2">
            {members.map((m) => {
                const memberBadges = badges[m._id] || [];
                return (
                    <li key={m._id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{m.name}</span>
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
