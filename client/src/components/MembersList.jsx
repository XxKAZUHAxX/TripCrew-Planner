import BadgeChip from "./BadgeChip.jsx";

// members: [{ _id, name, email }]
// badges:  { [userId]: ["The Ghost", ...] }
// definitions: { label: description }
export default function MembersList({
    members,
    creatorId,
    badges = {},
    definitions = {},
}) {
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
                                    <span className="badge bg-dark ms-2">
                                        Host
                                    </span>
                                )}
                            </span>
                        </div>
                        {memberBadges.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 mt-1">
                                {memberBadges.map((b) => (
                                    <BadgeChip
                                        key={b}
                                        label={b}
                                        description={definitions[b]}
                                    />
                                ))}
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
