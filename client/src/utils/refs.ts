/**
 * Resolves the id from a reference that may be either a raw id string or a
 * populated document (`{ _id }`). Handles the populated-vs-id duality that the
 * API exposes for fields like `creator`, `proposedBy` and `winningDestination`.
 */
export function refId(ref: string | { _id: string } | null | undefined): string | undefined {
    if (ref == null) return undefined;
    return typeof ref === 'string' ? ref : ref._id;
}
