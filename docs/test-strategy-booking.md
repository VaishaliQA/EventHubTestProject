# Test Strategy: Booking Management

## Executive Summary

This document defines the optimal test layer distribution for 60 booking management scenarios. The strategy follows the test pyramid principle: **many unit tests at the base, fewer API tests in the middle, component tests for UI state, and critical journey E2E tests at the top.**

### Key Philosophy
1. **Push tests DOWN** — Use the lowest layer that adequately tests the behavior
2. **Defense in depth** — Critical business rules tested at multiple layers
3. **Realistic pyramid** — Not an ice cream cone (everything at E2E)
4. **Automation efficiency** — Unit tests run in ms, E2E in seconds

---

## Test Distribution Summary

| Test Layer | Count | % of Total | Focus Areas | Avg Time | Build Order |
|---|---|---|---|---|---|
| **Unit** | 18 | 30% | Validation, ref generation, calcs, FIFO logic | ~1ms each | 1st |
| **API/Integration** | 20 | 33% | Endpoint contracts, error codes, auth, FIFO | ~100ms each | 2nd |
| **Component** | 12 | 20% | UI rendering, modals, toasts, empty states | ~300ms each | 3rd |
| **E2E** | 10 | 17% | Critical user journeys, cross-user, full flows | ~2s each | 4th |
| **Total** | **60** | **100%** | — | **~25s total** | — |

---

## Layer Assignments by Scenario

### UNIT TESTS (18 tests) — Backend Pure Functions & Validation

These tests validate pure functions and discrete business rules with mocked dependencies.

#### Input Validation (bookingValidator.js)
**Source**: `backend/src/validators/bookingValidator.js`

| TC ID | Title | Rationale | Test Function |
|---|---|---|---|
| TC-303 | Invalid customer email | Email validation is a pure function (express-validator) | `validateEmail('invalid-email')` returns error |
| TC-304 | Invalid phone (< 10 digits) | Phone length validation is pure logic | `validatePhone('12345')` throws error |
| TC-305 | Name < 2 characters | Length validation is pure logic | `validateName('A')` throws error |
| TC-306 | Quantity < 1 | Integer boundary validation | `validateQuantity(0)` throws error |
| TC-307 | Quantity > 10 | Integer boundary validation | `validateQuantity(11)` throws error |
| TC-309 | Missing required fields | Required field validation | Validator rejects null values |
| TC-310 | Non-numeric phone characters | Regex phone validation | Regex test on phone format |
| TC-407 | Very long customer name (char limit) | String length truncation/validation | Input sanitization logic |
| TC-408 | Unusual but valid email format | Email regex validation | Regex allows `+` and subdomain suffixes |

**Build command**:
```bash
npm run test:unit -- --grep "booking-validation"
```

#### Booking Reference Generation (bookingService.js)
**Source**: `backend/src/services/bookingService.js` → `randomRef()`, `generateUniqueRef()`

| TC ID | Title | Rationale | Test Function |
|---|---|---|---|
| TC-100 | Ref first letter matches event title | Format generation logic is pure | `randomRef('Tech Summit')` returns `T-[6_CHARS]` |
| TC-403 | Single-char title → valid ref | Edge case for ref generation | `randomRef('X')` returns `X-[6_CHARS]` |
| TC-404 | Special char title → valid ref | Special char handling in ref | `randomRef('#1 Event')` returns `#-[6_CHARS]` |

**Decision rationale**: 
- `randomRef()` function is 100% pure (no I/O, no DB)
- Collision retry logic in `generateUniqueRef()` requires mocking repo, better as API integration test

#### Price Calculation (bookingService.js)
**Source**: `backend/src/services/bookingService.js` → `totalPrice = event.price * quantity`

| TC ID | Title | Rationale | Test Function |
|---|---|---|---|
| TC-101 | Total price = event price × quantity | Pure Math function | `calculateTotal(299, 3)` returns `897` |

**Build command**:
```bash
npm run test:unit -- --grep "booking-calculation"
```

#### Seat Availability Logic (bookingService.js)
**Source**: `backend/src/services/bookingService.js` → per-user seat computation

| TC ID | Title | Rationale | Test Function |
|---|---|---|---|
| TC-102 | Per-user seat availability (boundaries) | Compute function: `Math.max(0, event.availableSeats - booked[eventId])` | `computePersonalSeats(10, 3)` returns `7` |
| TC-405 | Zero quantity edge case | Validation is pure logic | Throws error on `quantity <= 0` |
| TC-406 | Negative quantity edge case | Validation is pure logic | Throws error on `quantity < 0` |

**Build command**:
```bash
npm run test:unit -- --grep "booking-seats"
```

#### FIFO Pruning Logic Boundaries (bookingService.js)
**Source**: `backend/src/services/bookingService.js` → FIFO deletion logic

| TC ID | Title | Rationale | Test Function |
|---|---|---|---|
| TC-400 | User at 9th booking boundary | Boundary condition: 9 is max, no pruning needed yet | `isAtLimit(9, MAX_USER_BOOKINGS=9)` returns true but no deletion |
| TC-401 | Quantity = 10 (max boundary) | Integer validation | `validateQuantity(10)` passes |
| TC-402 | Quantity = 1 (min boundary) | Integer validation | `validateQuantity(1)` passes |
| TC-409 | Phone with leading zeros | Phone validation preserves leading zeros | Data integrity test |
| TC-410 | Exactly 9 bookings across events | Boundary condition verification | Confirm count logic works correctly |

**Build command**:
```bash
npm run test:unit -- --grep "booking-boundaries"
```

---

### API INTEGRATION TESTS (20 tests) — Backend Contracts & Error Handling

These tests verify API endpoints, status codes, error conditions, and business rule enforcement **without UI**.

#### Booking Creation & Reference (POST /api/bookings)
**Source**: `backend/src/controllers/bookingController.js::createBooking`, `backend/src/services/bookingService.js`

| TC ID | Title | Rationale | Test Endpoint | Expected |
|---|---|---|---|---|
| TC-001 | User books 1 ticket successfully | Full booking flow, verify 201 + ref format | `POST /api/bookings` with qty=1 | 201, ref starts with event title letter |
| TC-002 | User books 5 tickets in one transaction | Verify multi-ticket booking, price calc | `POST /api/bookings` with qty=5 | 201, totalPrice = price × 5 |
| TC-007 | Books 2nd + 3rd event successfully | Verify multiple bookings work | Create 3 consecutive bookings | All succeed with unique refs |
| TC-008 | Books same event twice (per-user) | Verify per-user re-booking allowed | Two bookings for same eventId | Both created, separate refs |
| TC-100 | Ref first letter matches event title | Verify ref format contract | Create bookings for T/B/I events | All refs match first letters |
| TC-104 | FIFO pruning deletes oldest (10th created) | FIFO business rule enforcement | Create 9 bookings, verify, create 10th | 1st booking deleted, 9 remain |
| TC-105 | FIFO prefers different-event booking | FIFO logic preference | 8 bookings Event X + 1 oldest Event Y, create 10th for X | Event Y booking deleted |
| TC-106 | Same-event FIFO → permanent seat burn | Special FIFO case: seat not restored | 9 bookings all Event X, create 10th, cancel | Seat count still reduced |

**Build command**:
```bash
npm run test:api -- --grep "POST.*bookings"
```

#### Booking Retrieval (GET /api/bookings, /api/bookings/:id, /api/bookings/ref/:ref)
**Source**: `backend/src/controllers/bookingController.js`

| TC ID | Title | Rationale | Test Endpoint | Expected |
|---|---|---|---|---|
| TC-003 | Navigate to booking details page | Verify GET endpoint returns all fields | `GET /api/bookings/:id` | 200, includes all fields (status, ref, event, customer, price) |
| TC-101 | Total price in API response | Verify price calculation in response | `GET /api/bookings/:id` | response.totalPrice = event.price × quantity |

**Build command**:
```bash
npm run test:api -- --grep "GET.*bookings"
```

#### Booking Cancellation (DELETE /api/bookings/:id, /api/bookings)
**Source**: `backend/src/controllers/bookingController.js::cancelBooking`, `clearAllBookings`

| TC ID | Title | Rationale | Test Endpoint | Expected |
|---|---|---|---|---|
| TC-004 | Cancel single booking | Verify DELETE endpoint & seat restoration | `DELETE /api/bookings/:id` | 200, booking removed, seats freed for user events |
| TC-005 | Clear all bookings at once | Verify bulk delete endpoint | `DELETE /api/bookings` (clear-all route) | 200, all user bookings deleted |

**Build command**:
```bash
npm run test:api -- --grep "DELETE.*bookings"
```

#### Insufficient Seats Error (POST /api/bookings)
**Source**: `backend/src/services/bookingService.js` → throws `InsufficientSeatsError`

| TC ID | Title | Rationale | Test Endpoint | Expected |
|---|---|---|---|---|
| TC-300 | Insufficient seats (exact boundary) | 400 error, qty > available | `POST /api/bookings` qty=4 when 3 available | 400, "Only 3 seat(s) available, but 4 requested" |
| TC-301 | User's personal availability < request | Per-user seat logic enforced | `POST /api/bookings` with user-computed shortage | 400, personalAvailable seats in error msg |

**Build command**:
```bash
npm run test:api -- --grep "insufficient-seats"
```

#### Not Found & Event Validation (POST/GET /api/bookings)
**Source**: `backend/src/services/bookingService.js` → throws `NotFoundError`

| TC ID | Title | Rationale | Test Endpoint | Expected |
|---|---|---|---|---|
| TC-302 | Event not found | 404 error on invalid eventId | `POST /api/bookings` eventId=999999 | 404, "Event with id 999999 not found" |
| TC-308 | Cancel booking not found | 404 error on invalid booking ID | `DELETE /api/bookings/999999` | 404, "Booking with id 999999 not found" |

#### Cross-User Authorization (403 Forbidden)
**Source**: `backend/src/services/bookingService.js::getBookingById`, `cancelBooking` → throws `ForbiddenError`

| TC ID | Title | Rationale | Test Endpoint | Expected |
|---|---|---|---|---|
| TC-200 | Cross-user booking access denied (403) | Authorization check: `booking.userId !== req.user.userId` | `GET /api/bookings/42` (User B token, User A booking) | 403, "You are not authorized..." |
| TC-201 | Cross-user API read denied (403) | Same auth check via API | `GET /api/bookings/42` with wrong user token | 403 Forbidden |
| TC-203 | Cannot read booking by ref if not owner | Ref-based access also checks ownership | `GET /api/bookings/ref/T-A3B2C1` (User B, User A booking) | 403, "You do not own this booking" |
| TC-204 | Cannot delete another user's booking | Delete also enforces ownership | `DELETE /api/bookings/42` (User B token, User A booking) | 403 Forbidden |
| TC-205 | Cannot clear another user's bookings | Clear-all only affects requester's bookings | `DELETE /api/bookings` (User B token) | User B's bookings cleared, User A's remain |

**Build command**:
```bash
npm run test:api -- --grep "auth|forbidden"
```

#### Authentication (401 Unauthorized)
**Source**: `backend/src/middleware/authMiddleware.js`

| TC ID | Title | Rationale | Test Endpoint | Expected |
|---|---|---|---|---|
| TC-202 | Unauthenticated access denied | Auth middleware blocks no-token requests | `GET /api/bookings` (no Authorization header) | 401 Unauthorized |

---

### COMPONENT TESTS (12 tests) — Frontend UI State & Interactions

These tests verify React component rendering, state management, and user interactions **in isolation** (no E2E page navigation).

#### Empty State Component
**Source**: `frontend/components/bookings/BookingCard.jsx`, `frontend/app/bookings/page.tsx` (EmptyState)

| TC ID | Title | Rationale | Component/Hook | Test Approach |
|---|---|---|---|---|
| TC-500 | Empty state showing no bookings | Render EmptyState when `bookings.length === 0` | EmptyState component | Mount with `{ data: [] }`, verify text & button |
| TC-501 | Loading state spinner | Render skeleton when `isLoading === true` | BookingCardSkeleton | Mount with `isLoading=true`, verify spinner visible |

#### Booking Card Component (List View)
**Source**: `frontend/components/bookings/BookingCard.jsx`

| TC ID | Title | Rationale | Component/Hook | Test Approach |
|---|---|---|---|---|
| TC-502 | Booking cards display all required info | Verify all fields render: ref, title, status, price, qty, date | BookingCard component | Mount with booking object, assert text content of each field |
| TC-508 | Toast on booking creation | Verify success toast displayed | useToast hook + Toast component | Mock mutation, trigger success, verify toast rendered |
| TC-509 | Toast on booking cancellation | Verify success toast on delete | useToast hook + Toast component | Mock cancel mutation, verify message |
| TC-510 | Error toast for insufficient seats | Verify red/error toast styling | Toast component | Render error variant, check styling classes |

#### Confirmation Dialogs
**Source**: `frontend/components/ui/ConfirmDialog.jsx`

| TC ID | Title | Rationale | Component/Hook | Test Approach |
|---|---|---|---|---|
| TC-506 | Cancel booking confirmation dialog | Verify modal renders with message & buttons | ConfirmDialog component | Mount with `open=true`, assert dialog text & button count |
| TC-507 | Clear all bookings confirmation dialog | Verify clear operation dialog | ConfirmDialog component | Mount clear variant, verify warning message & booking count displayed |

#### Refund Eligibility UI
**Source**: `frontend/app/bookings/[id]/page.tsx` (refund check button & result display)

| TC ID | Title | Rationale | Component/Hook | Test Approach |
|---|---|---|---|---|
| TC-504 | Refund button disabled after checked | Button state changes after result | Button state management | Simulate click → spinner → result, verify button disabled |
| TC-513 | Refund eligible message styling (green) | Green badge/text for qty=1 | Result component | Render eligible result, assert green styling class present |
| TC-514 | Refund non-eligible message styling (red) | Red badge/text for qty>1 | Result component | Render non-eligible result, assert red styling class present |

#### Pagination & List Display
**Source**: `frontend/app/bookings/page.tsx`

| TC ID | Title | Rationale | Component/Hook | Test Approach |
|---|---|---|---|---|
| TC-505 | Pagination controls with 10+ bookings | Verify pagination renders when total > pageSize | Pagination component | Render with 15 items, 9 per page, verify next button |
| TC-512 | Sandbox warning banner | Banner displays when count >= threshold | SandboxBanner component | Mount with 8 bookings, assert banner visible; with 3, hidden |

**Build command**:
```bash
npm run test:component -- --grep "booking"
```

---

### E2E TESTS (10 tests) — Critical User Journeys

These tests verify **complete user workflows** through the UI, database, and backend integration. Only include scenarios that:
1. Touch multiple pages
2. Require realistic browser state
3. Verify full-stack behavior
4. Are critical to business value

#### Core Booking Journeys
**Source**: Multiple pages + backend integration

| TC ID | Title | Steps | Why E2E | Expected |
|---|---|---|---|---|
| TC-001 (E2E variant) | User books 1 ticket and sees confirmation | Login → browse events → book 1 ticket → confirm → navigate /bookings → verify card | Tests full flow: auth → event selection → form validation → DB persist → page render | Booking appears on mocks with correct ref format |
| TC-003 (E2E variant) | Navigate to booking details page | Login → book event → click "View Details" → navigate to /bookings/:id → view all sections | Multi-page navigation, dynamic URL, nested data loading | Detail page loads with all sections (event, customer, price, etc.) |
| TC-006 (E2E variant) | Check refund eligibility for 1 ticket | Book 1 ticket → detail page → click "Check Refund Eligibility" → wait 4s spinner → see eligible message | Tests async spinner behavior, message timing, UI state change | Spinner for ~4s, then "Single-ticket... refund" message appears |
| TC-004 (E2E variant) | Cancel booking and verify removal | Book event → detail page → click "Cancel Booking" → confirm dialog → verify booking gone from list | Tests dialog flow, delete confirmation, list refresh | Booking deleted, removed from /bookings list |
| TC-005 (E2E variant) | Clear all bookings in one action | Book 3 events → /bookings → click "Clear All" → confirm → verify empty state | Bulk operation flow with confirmation | All bookings removed, empty state displays |

#### Security & Cross-User Journeys
**Source**: Multiple users + auth flow

| TC ID | Title | Steps | Why E2E | Expected |
|---|---|---|---|---|
| TC-200 (E2E variant) | Cross-user booking access denied | User A: book event, capture ID → User B: login, navigate to that booking ID directly | Cross-session testing, auth state separation | "Access Denied" message displayed to User B |

#### Multi-Booking & Complex State
**Source**: Multiple bookings, FIFO logic, state transitions

| TC ID | Title | Steps | Why E2E | Expected |
|---|---|---|---|---|
| TC-104 (E2E variant) | FIFO pruning visible on 10th booking | Create 9 bookings → verify all display → create 10th → refresh /bookings → oldest gone | Tests real database FIFO, visible UX impact | After 10th: only bookings 2-10 visible |
| TC-102 (E2E variant) | Per-user seat availability = accurate | User A books 3 seats from Event X (10 total) → User B views same event in UI → Books 2 seats → both see correct counts | Per-user seat computation, simultaneous users | User A sees 7 available, User B sees 10, then 8 |
| TC-107 (E2E variant) | Refund eligibility scenarios | Book 1-ticket booking → check eligibility (should be eligible) → book 3-ticket booking → check (should NOT be eligible) | Full UI flow with both branches | 1-ticket: green "eligible" message; 3-ticket: red "non-refundable" message |

**Build command**:
```bash
npm run test:e2e -- --grep "booking.*critical"
```

---

## Anti-Patterns Found and Avoided

### ❌ What NOT to Do

#### 1. **Input Validation at E2E** (WRONG)
❌ **Don't**: Test "Phone must be 10+ digits" by typing into browser for every edge case
✅ **Do**: Unit test validator, API test error response, 1 E2E happy path with valid phone

**Tests affected**: TC-303, TC-304, TC-305, TC-306, TC-307 → Moved to UNIT
**Why**: Validation logic is stateless, testable in isolation. Browser automation is 100x slower.

#### 2. **API Error Codes at E2E** (WRONG)
❌ **Don't**: Navigate to /events/999999, wait for error page, verify UI
✅ **Do**: Call API directly, verify 404 response

**Tests affected**: TC-302, TC-308 → Moved to API
**Why**: HTTP error codes don't require browser. Direct API call is faster and clearer.

#### 3. **FIFO Logic at E2E Only** (WRONG)
❌ **Don't**: Book 10 events, refresh page, check visually if 9 remain
✅ **Do**: Unit test pruning logic, API verify 9 bookings returned, optional E2E for UX

**Tests affected**: TC-104, TC-105, TC-106 → Unit + API, light E2E
**Why**: Database FIFO is testable without UI. E2E can verify UX but logic tested faster at lower layers.

#### 4. **Pure Math at E2E** (WRONG)
❌ **Don't**: Book ticket, navigate page, visually verify $299 × 3 = $897
✅ **Do**: Unit test calculation function

**Tests affected**: TC-101 → Unit test
**Why**: Multiplication is testable in isolation. No need for full app stack.

#### 5. **Every Scenario as E2E** (WRONG)
❌ **Don't**: 60 Playwright tests taking 2 minutes each = 2 hours total runtime
✅ **Do**: 18 unit (30s), 20 API (2s), 12 component (4s), 10 E2E (20s) = ~60s total

**Why**: Pyramid efficiency. Catch bugs fast, then integration test subset.

---

## Recommended Test Execution Order

### 1. Unit Tests First (~30 seconds)
Run validators, pure functions, calculations:
```bash
npm run test:unit -- --bail  # Stop on first failure
```

### 2. API Integration Tests (~2 seconds)
Test endpoints and business rule enforcement:
```bash
npm run test:api -- --bail
```

### 3. Component Tests (~4 seconds)
Test UI rendering in isolation:
```bash
npm run test:component -- --bail
```

### 4. E2E Tests (~20 seconds)
Test critical user journeys:
```bash
npm run test:e2e -- --bail
```

### Full Suite (Parallel if possible):
```bash
npm run test  # Runs all layers, ~30-40s total
```

---

## Decision Rationale for Contested Assignments

### Why TC-102 (Per-User Seat Availability) is Unit + API + E2E

**Business Rule**: "For dynamic user-created events: computed as `totalSeats - sum(user's booking quantities for that event)`"

| Layer | Test | Purpose |
|---|---|---|
| **Unit** | `computePersonalSeats(10, 3) → 7` | Math correctness of computation |
| **API** | `POST /api/bookings` with 2 users simultaneously | Ensures calculation per-user server-side |
| **E2E** | User A books, sees seats reduce; User B sees full count; both book again | Full-stack verification with realistic delays |

**Defense in depth**: Catch edge cases at math level, integration at API, user experience at E2E

### Why TC-104 (FIFO Pruning) is Unit + API + E2E

**Business Rule**: "When limit [9] reached, the OLDEST booking is automatically deleted (FIFO replacement)"

| Layer | Test | Purpose |
|---|---|---|
| **Unit** | `selectOldestBooking([b1, b2, ..., b9]) → b1` | Sorting/selection logic |
| **API** | `POST /api/bookings` (10th creation) → verify only 9 in response | Database deletion verified |
| **E2E** | Create 9, verify all listed, create 10th, refresh, verify oldest gone | User sees expected bookings on page |

**Why multi-layer**: Pruning can fail at logic level (sort bug), database level (delete fails), or UI level (stale cache)

### Why TC-106 (Same-Event FIFO Seat Burn) is Unit + API

**Business Rule**: "In same-event fallback, permanently burn a seat so count still drops"

| Layer | Test | Purpose |
|---|---|---|
| **Unit** | Mock repo, verify `decrementSeats()` called when `sameEventFallback = true` | Logic pathway verified |
| **API** | 9 bookings all for Event X, create 10th, verify Event X available seats decreased | Database state reflects burn |
| **NOT E2E** | (Can't easily verify "permanent" — seat reduction is same visually) | UI doesn't distinguish reason |

**Why not E2E**: No observable difference from normal seat reduction. API test suffices.

### Why TC-200 (Cross-User Booking Access) is API + E2E

**Business Rule**: "Cross-user access to bookings returns 403 Forbidden"

| Layer | Test | Purpose |
|---|---|---|
| **API** | Direct HTTP request with User B token for User A booking → verify 403 | Contract guaranteed |
| **E2E** | User A books, User B directly navigates to URL → verify "Access Denied" page | UX flow and auth state tested |
| **NOT Unit** | No pure function to test; auth is middleware-level |

**Why multi-layer**: API protects data, E2E protects user UX. Both needed.

---

## Test Data Requirements

### Unit Tests
- Constants: event titles, phone formats, email patterns
- No database or fixtures needed

### API Tests
Requires seeded test database. Run before API tests:
```bash
npm run seed
npm run test:api
```

#### Required Test Accounts
| Email | Password | Purpose |
|---|---|---|
| `rahulshetty1@gmail.com` | `Magiclife1!` | User A (bookings) |
| `rahulshetty1@yahoo.com` | `Magiclife1!` | User B (cross-user tests) |

### Component Tests
- Mock React Query hooks (`useBookings`, `useCreateBooking`, etc.)
- No browser needed
- Mock data: sample Booking objects

### E2E Tests
- Fresh database state via `npm run seed`
- Live frontend + backend running on localhost
- Clear browser cache between tests (handle via test setup)

---

## Implementation Roadmap

### Phase 1: Unit Tests (2 days)
- [ ] Booking validation test suite (TC-303-310, TC-409)
- [ ] Ref generation tests (TC-100, TC-403, TC-404)
- [ ] Price calculation (TC-101)
- [ ] Seat availability logic (TC-102, TC-405, TC-406)
- [ ] Boundary conditions (TC-400, TC-401, TC-402, TC-410)

**Output**: `tests/unit/bookingService.spec.js`, `tests/unit/bookingValidator.spec.js`

### Phase 2: API Tests (3 days)
- [ ] Booking creation (TC-001, TC-002, TC-007, TC-008)
- [ ] FIFO logic (TC-104, TC-105, TC-106)
- [ ] Retrieval (TC-003)
- [ ] Cancellation (TC-004, TC-005)
- [ ] Error cases (TC-300, TC-301, TC-302, TC-308)
- [ ] Authorization (TC-200, TC-201, TC-202, TC-203, TC-204, TC-205)

**Output**: `tests/api/bookingApi.spec.js`

### Phase 3: Component Tests (2 days)
- [ ] Empty states (TC-500, TC-501)
- [ ] Booking card rendering (TC-502, TC-508-510)
- [ ] Dialogs (TC-506, TC-507)
- [ ] Refund UI (TC-504, TC-513, TC-514)
- [ ] Pagination & warnings (TC-505, TC-512)

**Output**: `tests/component/BookingCard.spec.js`, `tests/component/BookingDetail.spec.js`

### Phase 4: E2E Tests (1-2 days)
- [ ] Core journeys (TC-001, TC-003, TC-004, TC-005, TC-006 E2E variants)
- [ ] Cross-user (TC-200 E2E variant)
- [ ] Complex state (TC-104, TC-102, TC-107 E2E variants)

**Output**: `tests/e2e/booking-flow.spec.js`, `tests/e2e/booking-security.spec.js`

---

## Success Criteria

| Metric | Target | Acceptance |
|---|---|---|
| **Total Coverage** | 60 scenarios | 100% of domain rules tested |
| **Unit Test Runtime** | < 100ms | Fast feedback loop |
| **API Test Runtime** | < 5s | Test suite in minutes |
| **Component Runtime** | < 10s | Isolated component validation |
| **E2E Runtime** | < 30s | Critical paths verified |
| **Overall Test Suite** | < 60s | Full validation in 1 minute |
| **Bug Detection** | 80%+ of issues caught at unit/API layers | Pyramid prevents regression |
| **Maintainability** | No E2E tests for pure logic | All tests use appropriate layer |

---

## References

- Business Rules: `.claude/skills/eventhub-domain/business-rules.md`
- API Contracts: `.claude/skills/eventhub-domain/api-reference.md`
- Playwright Standards: `.claude/skills/playwright-best-practices/SKILL.md`
- Test Scenarios: `docs/test-scenarios-booking.md`
- Backend Services: `backend/src/services/bookingService.js`
- Backend Controller: `backend/src/controllers/bookingController.js`
- Validators: `backend/src/validators/bookingValidator.js`
- Frontend Hooks: `frontend/lib/hooks/useBookings.ts`
- Frontend Components: `frontend/components/bookings/BookingCard.jsx`
