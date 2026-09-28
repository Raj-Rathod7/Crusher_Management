# Server Changes

## Active-record handling

- Every entity now inherits the shared active/timestamp contract, and Hibernate applies `is_active = true` automatically to entity and relationship queries through `@SQLRestriction`.
- Repository deletes are converted to soft deletes with entity-specific `@SQLDelete` statements.
- Inactive users are excluded from authentication and user lookups.
- Users with inactive or missing roles cannot authenticate.
- User, customer, role, and material list/detail operations now exclude inactive records.
- Customer and user updates preserve the existing active state when the request omits `isActive`.
- Role and material deletion now uses the existing soft-delete convention by setting `isActive` to `false` instead of deleting the row.
- Invoice creation rejects inactive customers and materials, and payment creation rejects inactive customers.
- Expense creation rejects inactive categories and users.
- Customer deactivation is blocked while active invoices have an outstanding balance.
- Completed the expense API routes used by the client: category listing, update, and soft delete; expense reads now fetch category and creator relationships explicitly.
- Registration reactivates an existing inactive default role instead of attempting to insert a duplicate role.

These changes keep soft-deleted records out of normal application flows. The shared JPA superclass keeps active state and timestamps consistent without duplicating lifecycle callbacks in every entity. `createdBy` remains an explicit relationship on transactional entities to avoid circular ownership on `User` and singleton/configuration records.

For production rollout, existing databases must backfill the new non-null audit columns before enabling schema validation; the current development profile still uses Hibernate schema updates.

## Other server fixes

- Expanded `seed.sql` with rerunnable demo users, customers, business settings, truck entries, paid/partial/pending invoices, invoice items, and expenses for dashboard development. Seeded demo users use the password `password` and should be replaced or removed before production deployment.
- Made the Docker build artifact deterministic (`crusher-management.jar`) so the executable and `.original` Maven JAR cannot both match the runtime `COPY` instruction.
- Added an authenticated `/dashboard` summary endpoint with SQL aggregates for invoice value, collections, outstanding balance, expenses, active customers, truck entries, and five recent invoices.
- Development CORS now accepts all origins through `setAllowedOriginPatterns`; replace `CORS_ALLOWED_ORIGINS=*` with a production origin allowlist before deployment.
- Added the client operations dashboard with financial position, collection rate, operational counts, recent invoice activity, loading state, and retry state.
- Invoice creation now saves once and returns the saved entity, avoiding duplicate persistence.
- Removed the unused invoice item total calculation that was not applied to the invoice.
- Invoice and payment creation now record the authenticated active user in `createdBy`.
- Added indexed, database-backed `/page` collection endpoints for non-payment resources.
- Kept `/users/is-authenticated` available to authenticated users while restricting user administration to admins.
- Added `@EntityGraph` for invoice to-one relationships while keeping paged queries free of collection fetch joins.