import type { ArchetypeDefinitions, BadgeMap, UserRef } from '@tripcrew/shared';
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
        <ul className="list-group">
            {members.map((m) => {
                const memberBadges = badges[m._id] || [];
                return (
                    <li key={m._id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                            <span>
                                {m.name}
                                {m._id === creatorId && (
                                    <span className="badge bg-dark ms-2">Host</span>
                                )}
                            </span>
                        </div>
                        {memberBadges.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 mt-1">
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
