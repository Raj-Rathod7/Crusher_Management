# Production Readiness Plan

Payment processing and documented missing features are intentionally excluded from this plan.

## Implementation order

1. [x] Secure configuration, CORS, registration exposure, and authorization defaults.
2. [x] Invoice correctness: derive status, validate financial fields, and add transactional boundaries.
3. [x] Database-backed filtering, indexes, and pagination for non-payment list endpoints.
4. [x] Request validation and safe password updates.
5. [x] Customer deactivation and invoice-side integrity rules outside `PaymentService`.
6. [x] Exception handling and JWT failure handling.
7. [ ] Focused regression tests for the changed server behavior; execution is blocked in the current shared environment.

Each step is implemented and diagnostically validated before the next step begins. Payment processing remains intentionally deferred.