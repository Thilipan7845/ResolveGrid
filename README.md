# ResolveGrid

ResolveGrid is a fictional, browser-only SIH 2026 prototype for centralized institutional complaint monitoring and inter-bureau coordination. It is not connected to AICTE systems and does not use a trained AI model, external API, backend, or real message delivery.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite and sign in with the disclosed local sample account:

```text
Email:    official@resolvegrid.local
Password: ResolveGrid-Access
```

Select an access role to explore its permission simulation. Authentication and role permissions are browser-local prototype behavior, not production security. Build the production bundle with:

```bash
npm run build
```

## Sample workflows

- Browse the dashboard, register, filter, update, assign and close fictional complaints.
- Review explainable potential-overlap alerts and initiate inter-bureau coordination.
- Reassign coordination cycles, add remarks, and inspect action history and linked case statuses.
- Exercise Regulation Bureau, PGRC, and Coordination Cell workflows with assigned sample officers and department workload.
- Inspect institution profiles, deadlines, notifications, reports and CSV export.
- Configure theme and notification categories, switch simulated roles, and restore the original sample dataset in Settings.

Complaint records, workflow decisions, appearance, and notification preferences are persisted in this browser's LocalStorage. The optional remembered sign-in is stored locally; unchecking “Keep me signed in” limits it to the current tab session. Clearing browser storage removes local changes. There is no backend, database server, real authentication, external AI service, email/SMS delivery, or AICTE integration.

The LocalStorage migration adds the Coordination Cell sample case to existing v2 sample workspaces without replacing users' complaint records; it also creates any newly applicable rule-based overlap alerts.

## Local matching

The deterministic overlap rules award weighted points for a shared institution ID (35), identical category (25) or related Admission/Fees categories (12), meaningful shared description terms (up to 24), and a different Bureau/Cell (12). A closed case subtracts 5. The resulting capped score is an illustrative rule-based similarity score, not a probability. Alerts show the rule contributions so officials can inspect the reason for a match. Disposal charts count cases at their recorded resolution/closure date.

All sample institution and case records are fictional. Deadline states are computed from complaint due dates and current browser time.
