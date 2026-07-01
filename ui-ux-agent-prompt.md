# TripCrew Planner — UI/UX Improvements Agent Prompt

## Context

You are working on **TripCrew Planner**, a full-stack collaborative trip planning application. The frontend is built with **React + TypeScript + Vite**, styled with **Tailwind CSS** and **shadcn/ui** components. The backend is **Node.js + Express + MongoDB**.

Your task is to implement all UI/UX improvements listed below across the frontend (`client/src/`). Apply industry-standard practices for usability, accessibility, feedback, and mobile responsiveness throughout.

**Key directories:**

| Path                     | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `client/src/pages/`      | Page-level route components               |
| `client/src/components/` | Reusable UI components                    |
| `client/src/api/`        | Axios-based API layer                     |
| `client/src/context/`    | React context (Auth)                      |
| `shared/src/`            | Shared TypeScript types (client + server) |

**General principles — apply these everywhere:**

- Every mutation (create, update, delete) must provide clear **success and error feedback** via toast notifications.
- Every **destructive action** requires a confirmation dialog before executing.
- Every async operation must **disable its trigger button** while in-flight to prevent double-submit.
- The UI must be **fully functional on mobile** — touch events must be supported.
- Labels, badges, and technical terms must be **self-explanatory** or have accessible tooltips.
- **Loading, empty, and error states** must always be handled visually — no blank screens.
- Use existing **shadcn/ui components** wherever possible (`AlertDialog`, `Tooltip`, `Badge`, `Progress`, `Sonner`). Do not install heavy new libraries.
- Update `shared/src/domain.ts` or `shared/src/api.ts` when new response fields are required.
- Run the test suite after resolving each issue: `cd client && npm run test` and `cd server && npm run test`.

---

## Issue 1 — Invitation Code Input Window

**Problem:** There is no way for a user to enter an invitation code from the trips list page. The only entry point is a direct `/join/:inviteCode` URL, which users may not have convenient access to.

**What to implement:**

- Add an "Enter invite code" input field and submit button on `TripsList.tsx` (as a card in the right column, below the create-trip form).
- On submit, validate the code client-side (non-empty, trimmed). Then navigate to `/join/:code`.
- On the `Join.tsx` page, if the API returns an invalid or expired code error, display a clear inline error: _"This invite code is invalid or has expired."_ — not a generic error message.
- If the user is already a member of the trip tied to the code, show: _"You're already a member of this trip."_ with a link directly to the trip dashboard instead of re-joining.

**Acceptance criteria:**

- User can paste or type a code on the trips list page and be taken to the Join page.
- The input clears on successful navigation.
- Invalid codes and already-a-member cases produce human-readable error messages.

---

## Issue 2 — Leave Trip / Delete Trip Buttons

**Problem:** There is no UI for a non-host member to leave a trip, and no UI for the host to delete a trip. Both backend endpoints exist but are unreachable from the frontend.

**What to implement:**

- On `TripDashboard.tsx`, add a **"Leave Trip"** button (non-host members only). Clicking opens a confirmation dialog:
  _"Are you sure you want to leave [trip name]? You will need a new invite to rejoin."_
- On `TripDashboard.tsx`, add a **"Delete Trip"** button (host only). Clicking opens a confirmation dialog:
  _"This will permanently delete [trip name] and all its data. This action cannot be undone."_
- Both buttons should live in an unobtrusive location (e.g., trip settings area or bottom of the sidebar) so they do not interrupt the main workflow.
- Wire each to its API endpoint. `deleteTrip` exists in `trips.api.ts` — expose it. Add `leaveTrip` if the endpoint is available.
- On success, navigate back to `/trips` and show a toast: _"You have left [trip name]."_ or _"[Trip name] has been deleted."_

**Acceptance criteria:**

- Buttons are visible and correctly gated by role (host vs. non-host member).
- Confirmation dialogs appear with action-specific copy before any destructive call.
- User is redirected to `/trips` and notified via toast on success.
- Errors are caught and shown via toast.

---

## Issue 3 — Voting Deadline Visibility + Auto-Conclude Logic

**Problem:** The voting deadline is captured at trip creation but is never displayed anywhere in the UI. There is no manual "decide now" button for the host, and there is no indication of what happens when the deadline passes. The Wheel of Destiny has no auto-trigger fallback visible to users.

**What to implement:**

**Deadline display:**

- Show the voting deadline on both `TripDashboard.tsx` (near the ScoreBoard column or dashboard header) and `VotePage.tsx`.
- Format: _"Voting closes: Jul 15, 2026 at 11:59 PM"_
- When the deadline has passed, replace with a warning label: _"Voting deadline has passed."_
- When fewer than 48 hours remain, render a live countdown: _"Closes in 23h 41m"_
- If no deadline was set, show: _"No voting deadline set."_

**Manual conclude (host only):**

- On `TripDashboard.tsx`, show a **"Conclude Voting Now"** button for the host when `trip.status === 'voting'`.
- Clicking opens a confirmation dialog: _"End voting early and determine the winner based on current votes?"_
- On confirm, call the conclude endpoint. If there is a clear winner, show the winner and navigate to the Playbook. If there is a tie (deadlock), navigate to `/trips/:tripId/wheel`.

**Auto-conclude on page load:**

- When the deadline has passed and `trip.status` is still `'voting'`, the dashboard should call the conclude/check endpoint on page load to trigger server-side auto-resolution.
- Display a banner: _"The voting deadline has passed. Calculating the result…"_ while in progress.

**Wheel auto-trigger notice:**

- On `WheelPage.tsx`, display an informational note: _"If the host does not spin within 12 hours of the deadline, the wheel will spin automatically."_

**Decision logic (from spec):**

```
if (currentTime < deadline) {
  // Host can conclude early via manual button.
  // On tie after manual conclude → show Wheel of Destiny.
} else if (currentTime >= deadline) {
  // System auto-decides based on highest vote count.
  // On tie → Wheel of Destiny appears.
  // Wheel has its own 12-hour auto-trigger timer.
}
```

**Acceptance criteria:**

- Deadline is visible on both the dashboard and the vote page with correct formatting.
- Countdown renders correctly when < 48 hours remain.
- Host can conclude voting early; a tied result navigates to the Wheel.
- Post-deadline auto-resolution is triggered on dashboard load with a user-visible status banner.
- The Wheel auto-trigger notice is visible on the Wheel page.

---

## Issue 4 — Confusing Labels and Ambiguous Terminology

**Problem:** Several labels, badges, and terms in the UI are ambiguous or technically worded, and will confuse non-technical users. Industry standard is plain language with contextual tooltips for any term that could be misread.

**What to fix:**

| Location                              | Current                                              | Fix                                                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DestinationList.tsx` budget select   | `low`, `medium`, `high`                              | Display as `💰 Low (under ₱1000)`, `💰💰 Medium (₱1000–₱5,000)`, `💰💰💰 High (₱5,000+)`. Add an `ⓘ` tooltip icon next to the budget label.                        |
| `DestinationCard.tsx` budget badge    | `low` / `medium` / `high`                            | Render as `💰 Low`, `💰💰 Medium`, `💰💰💰 High` with a tooltip on hover showing the price range.                                                                  |
| `ScoreBoard.tsx` subtitle             | `Borda count`                                        | Change to `Ranked-choice score`. Add an `ⓘ` tooltip: _"Points are assigned by ranking order — the higher you rank a destination, the more points it gets."_        |
| `VotePage.tsx` unranked section label | `Unranked (won't count)`                             | Change to `Not yet ranked — move items above this line to include them in your vote.`                                                                              |
| `ChaosButton` ineligible message      | `tied score or the deadline passes with low turnout` | Change to `Available when votes are tied or not enough members have voted by the deadline.`                                                                        |
| `Legend.tsx`                          | Hardcoded `0, 1, 2, 3+` labels                       | Render dynamically based on `totalMembers` prop. Show as `0 available`, `1 available`, ..., `All [N] available`. Pass `totalMembers` down from `AvailabilityPage`. |
| `TaskRow.tsx` completion count        | `{count} done`                                       | Change to `{count} of {totalMembers} completed`. Pass `totalMembers` from `PlaybookPage`.                                                                          |
| `Checklist` header                    | No progress indicator                                | Add a progress bar (shadcn `Progress`) or text above the list: _"3 / 7 tasks completed."_                                                                          |
| Trip status badge                     | `voting`, `decided`, `archived`                      | Render as `🗳️ Voting in progress`, `✅ Destination decided`, `📦 Archived` respectively.                                                                           |

**Acceptance criteria:**

- Budget tiers show clear monetary ranges in both the form select and destination card badge.
- All technical terms are plain-language or have accessible, descriptive tooltips.
- Legend, task counts, and checklists adapt to actual group size rather than hardcoded values.

---

## Issue 5 — Availability Page Enhancements

**Problem:** The availability calendar is locked to a hardcoded 3-month window with no navigation. It is also entirely non-functional on touch devices (mobile/tablet), and there is no summary showing which dates have the highest group availability.

**What to implement:**

**Month navigation:**

- Add previous/next month navigation arrows above the calendar grid in `AvailabilityPage.tsx`.
- Allow navigation at least 6 months forward from the current month.
- Disable the "previous" arrow when already at the current month (do not allow past-month navigation).

**Touch support (Pointer Events API):**

- Replace all `onMouseDown` / `onMouseEnter` / `onMouseUp` handlers in `CalendarGrid.tsx` and `DateCell.tsx` with `onPointerDown` / `onPointerEnter` / `onPointerUp`.
- Call `e.preventDefault()` on `pointerdown` to prevent scroll interference during drag-selection on touch devices.
- Test on both mouse and touch input.

**Availability summary panel:**

- Below the calendar, add a collapsible panel titled _"Best dates for your group."_
- List dates sorted from highest to lowest availability count.
- Each row shows the date and a count: `5 / 6 members available`.
- On hover/focus, show a tooltip listing the names of available members for that date.
- Only show dates where at least 1 member is available.

**Legend context:**

- Update `Legend.tsx` to accept `totalMembers` as a prop and display dynamic labels (see Issue 4).

**Acceptance criteria:**

- Month navigation works and respects the current-month lower bound.
- Date selection works via touch on iOS Safari and Android Chrome.
- The availability summary panel lists top dates with member counts and name tooltips.
- Legend labels reflect the actual group size.

---

## Issue 6 — Voting Lock When Destination Is Decided

**Problem:** After a trip's destination is decided (`trip.status === 'decided'`), the Vote page is still fully accessible via direct URL. Members can see and interact with the ranking UI as if voting were still open. Additionally, the "Propose a destination" form on the dashboard remains active.

**What to implement:**

- On `VotePage.tsx`, check `trip.status`. When `decided`, replace the interactive voting UI with a read-only view:
    - Banner at the top: _"Voting has closed. The destination has been decided."_ with a link to the Playbook.
    - Ranked list in read-only mode (no up/down buttons, no Save button).
    - ScoreBoard remains visible showing final scores.
- On `TripDashboard.tsx`, disable the "Vote" navigation button visually when `trip.status === 'decided'`. Add a tooltip: _"Voting is closed."_
- On `DestinationList.tsx`, disable and visually grey out the "Propose a destination" form when `trip.status !== 'voting'`. Show a label: _"Destination proposals are closed."_

**Acceptance criteria:**

- Vote page shows a clear "voting closed" state with a Playbook link when `status === 'decided'`.
- No mutations (save vote, propose destination) are possible once the trip is decided.
- Read-only view still renders final rankings and scores.

---

## Issue 7 — Global Toast / Notification System

**Problem:** There is no global notification system in the app. Several mutation handlers across `TripDashboard.tsx` and `PlaybookPage.tsx` have no `try/catch` at all and will silently fail — the user sees nothing when an error occurs. Existing success states use easy-to-miss inline text.

**What to implement:**

- Install **Sonner** (`npm install sonner` in `client/`). It is the shadcn/ui-recommended toast library.
- Add `<Toaster />` to `App.tsx` (inside the router, outside routes).
- Replace all inline `setSaved` / `Saved!` patterns with `toast.success()` calls.
- Add `try/catch` to every unhandled mutation handler and call `toast.error(err?.message ?? 'Something went wrong.')` on failure.

**Specific locations to fix:**

| File                   | Handler                      | Change                                                                                             |
| ---------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `TripDashboard.tsx`    | `handlePropose`              | Add try/catch. `toast.success('Destination proposed!')` on success. `toast.error(...)` on failure. |
| `TripDashboard.tsx`    | `handleDelete` (destination) | Add try/catch. `toast.success('Destination removed.')` / `toast.error(...)`.                       |
| `TripDashboard.tsx`    | `handleToggleInvite`         | Add try/catch. `toast.success('Invite link updated.')` / `toast.error(...)`.                       |
| `PlaybookPage.tsx`     | `handleSaveInstructions`     | Add try/catch. `toast.success('Instructions saved.')` / `toast.error(...)`.                        |
| `PlaybookPage.tsx`     | `handleAddTask`              | Add try/catch. `toast.success('Task added.')` / `toast.error(...)`.                                |
| `PlaybookPage.tsx`     | `handleToggle`               | Add try/catch. `toast.error(...)` on failure.                                                      |
| `PlaybookPage.tsx`     | `handleDelete` (task)        | Add try/catch. `toast.success('Task deleted.')` / `toast.error(...)`.                              |
| `VotePage.tsx`         | `handleSave`                 | Replace `setSaved(true)` inline text with `toast.success('Vote saved!')`.                          |
| `AvailabilityPage.tsx` | auto-save                    | Replace inline `Saved!` text with `toast.success('Availability saved.')`.                          |

**Acceptance criteria:**

- Sonner is installed and `<Toaster />` is mounted in `App.tsx`.
- All successful mutations produce a descriptive success toast.
- All failed mutations produce an error toast with a human-readable message.
- No unhandled promise rejections remain in any mutation handler.

---

## Issue 8 — Confirmation Dialogs for Destructive Actions

**Problem:** Destructive actions — deleting a destination, deleting a checklist task, and deactivating the invite link — execute immediately on a single click with no confirmation step.

**What to implement:**

- Use the shadcn `AlertDialog` component for all confirmation dialogs.
- Apply to the following actions:

| Action                                       | Dialog description                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Delete destination (`DestinationCard.tsx`)   | _"Remove [destination name] from the list? This cannot be undone."_                          |
| Delete checklist task (`TaskRow.tsx`)        | _"Delete this task? All completion records will be lost."_                                   |
| Deactivate invite link (`TripDashboard.tsx`) | _"Deactivate the invite link? Anyone with the old link will no longer be able to join."_     |
| Leave trip (Issue 2)                         | _"Are you sure you want to leave [trip name]? You will need a new invite to rejoin."_        |
| Delete trip (Issue 2)                        | _"This will permanently delete [trip name] and all its data. This action cannot be undone."_ |

**Acceptance criteria:**

- No destructive action executes without a prior confirmation dialog.
- Dialog titles and body copy are specific to each action — not generic.
- The Cancel button dismisses the dialog with no side effects.
- Confirm button is styled as destructive (red/danger variant).

---

## Issue 9 — Partial Vote Warning on Vote Page

**Problem:** If a user saves a vote with destinations remaining in the "Unranked" section, those destinations are excluded from the Borda count with no warning. Users may not realize their vote is incomplete.

**What to implement:**

- In `VotePage.tsx`, before calling the save handler, check if `unranked.length > 0`. If so, show a confirmation dialog:
  _"You have [N] unranked destination(s). Unranked items receive no points and won't influence the result. Save anyway?"_
- If the user confirms, proceed with saving. If not, dismiss so they can finish ranking.
- Below the unranked section, always show a subtle static note: _"Items here receive no points toward the vote."_

**Acceptance criteria:**

- Saving with unranked items triggers a specific confirmation dialog.
- The static note below the unranked section is always visible.
- Confirming "save anyway" proceeds normally; cancelling keeps the current state.

---

## Issue 10 — Who Has Voted Indicator

**Problem:** On the dashboard and vote page, there is no visibility into which members have submitted a vote. Members also cannot tell whether they themselves have already voted before navigating to the vote page.

**What to implement:**

- On `TripDashboard.tsx`, in the Members list, display a small voted badge (e.g., `🗳️` or a green checkmark) next to each member's name if they have submitted a vote.
- Show a vote progress summary near the ScoreBoard: _"3 of 6 members have voted."_
- The `DashboardResponse` (in `shared/src/api.ts`) should include a `votedMemberIds: string[]` field. If it does not already exist, add it — the server can derive it from the votes collection.
- On `VotePage.tsx`, if the current user has an existing vote, show a banner at the top: _"You've already submitted a vote. You can update it below."_

**Acceptance criteria:**

- Dashboard members list shows voted/not-voted status per member.
- Vote progress count (e.g., `3 of 6`) is shown on the dashboard.
- VotePage shows a clear "already voted, you can update" banner for returning voters.

---

## Issue 11 — WheelPage Non-Creator Experience

**Problem:** Non-creator members who navigate to `/trips/:tripId/wheel` see only the wheel canvas graphic with no context. `ChaosButton` returns `null` for non-creators, leaving the page blank and confusing.

**What to implement:**

- Replace the `ChaosButton` `null` return with an informational waiting state for non-creators:
  _"⏳ Waiting for [host name] to spin the Wheel of Destiny…"_
- Add a **"Refresh"** button (or implement 10-second polling) on the Wheel page for non-creators to check if the host has spun.
- Once the trip status becomes `decided`, all members (not just the creator) should see `WinnerBanner` on the Wheel page.
- Clear any polling interval on component unmount to avoid memory leaks.

**Acceptance criteria:**

- Non-creators see a descriptive waiting message instead of a blank page.
- After the host spins, non-creators can see the winner via refresh or polling.
- Polling interval (if used) is reasonable (≤ 10s) and cleans up on unmount.

---

## Issue 12 — Join Page Trip Preview

**Problem:** The Join page at `/join/:inviteCode` shows only the raw invite code and a "Join this trip" button. Users have no idea which trip they are joining until after the action completes.

**What to implement:**

- On page load, call a lightweight preview endpoint (e.g., `GET /trips/preview/:inviteCode`) that returns the trip name and member count without requiring membership. Add this endpoint server-side if it does not exist.
- Display trip info above the join button: _"You've been invited to join **[Trip Name]** · [N] members already joined."_
- If the code is invalid or expired, surface the error immediately on page load — not only after the user clicks "Join."
- If the current user is already a member, show: _"You're already a member of this trip."_ with a direct link to the dashboard instead of showing the join button.

**Acceptance criteria:**

- Trip name and member count appear on the page before the user interacts.
- Invalid/expired codes show an error on page load.
- Already-a-member edge case is handled gracefully with a dashboard link.

---

## Issue 13 — ScoreBoard Winner Highlight

**Problem:** The `ScoreBoard` component renders all destinations with identical styling. The top-ranked destination has no visual distinction, making it hard to see at a glance who is winning.

**What to implement:**

- In `ScoreBoard.tsx`, sort entries by score descending and apply a gold/highlighted styling to the top entry (border, background tint, or trophy icon `🏆`).
- If two or more entries are tied at the top score, highlight all tied entries with a distinct style (e.g., amber border) and add a label: _"Tied — Wheel of Destiny may be needed."_
- When `trip.status === 'decided'`, mark the winning destination with a `✅` crown icon and "Winner" label.

**Acceptance criteria:**

- The top-scoring destination is visually distinct at a glance.
- Ties are explicitly called out in the scoreboard.
- Decided trips show the winner clearly with a winner label.

---

## Issue 14 — Missing 404 / Not Found Page

**Problem:** Unknown routes silently redirect to `/` with no message, leaving users confused about why they ended up on the home page.

**What to implement:**

- Create `client/src/pages/NotFound.tsx`: a simple page reading _"404 — Page not found"_ with a brief message and a _"Back to my trips"_ button linking to `/trips`.
- In `App.tsx`, replace the wildcard `<Navigate to="/" />` fallback route with `<Route path="*" element={<NotFound />} />`.

**Acceptance criteria:**

- Navigating to any unknown path renders the 404 page.
- The 404 page has a working link back to `/trips`.

---

## Summary Checklist

Before marking the work as complete, verify the following:

- [ ] All 14 issues above have been implemented.
- [ ] `npm run test` passes in both `client/` and `server/`.
- [ ] No unhandled promise rejections exist in any mutation handler.
- [ ] All destructive actions are guarded by a confirmation dialog.
- [ ] All mutations show a toast on both success and failure.
- [ ] The availability calendar works on touch (mobile) devices.
- [ ] The vote page is locked in read-only mode when `trip.status === 'decided'`.
- [ ] Labels, badges, and technical terms are plain-language or have tooltips.
- [ ] No blank screens — all pages handle loading, empty, and error states.
- [ ] All changes are mobile-responsive.
