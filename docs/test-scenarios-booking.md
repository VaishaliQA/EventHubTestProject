# Booking Management Test Scenarios

---

## Happy Path Scenarios (TC-001-099)

### TC-001: User books a single ticket successfully
**Category**: Happy Path
**Priority**: P0
**Preconditions**: 
- User is logged in
- Event has available seats
- User has < 9 existing bookings
**Steps**:
1. Navigate to /events
2. Select a seeded event (e.g., "Tech Conference Bangalore")
3. Click "Book Now"
4. Set quantity to 1 via +/- buttons
5. Enter customer name (min 2 chars), email, phone (min 10 digits)
6. Click "Confirm Booking"
**Expected Results**:
- Booking confirmation card displays with booking reference
- Booking reference follows format: `[LETTER]-[6_ALPHANUMERIC]` (e.g., `T-A3B2C1`)
- First letter matches event title first character (uppercase)
- User can click "View My Bookings" to see the booking
- Event seat count decreases by 1
**Business Rule**: Booking Reference Format (BR7)
**Suggested Layer**: E2E

### TC-002: User books multiple tickets (5) in one transaction
**Category**: Happy Path
**Priority**: P0
**Preconditions**: 
- User is logged in
- Event has >= 5 available seats
- User has < 9 existing bookings
**Steps**:
1. Navigate to /events
2. Click "Book Now" on event
3. Click + button 4 times to set quantity to 5
4. Fill customer form with valid data
5. Click "Confirm Booking"
**Expected Results**:
- Single booking created with quantity = 5
- Total price = event price × 5
- Booking reference generated (first letter matches event)
- Event available seats reduce by 5
**Business Rule**: Price Calculation (BR9)
**Suggested Layer**: E2E

### TC-003: User navigates to booking details and views all info
**Category**: Happy Path
**Priority**: P0
**Preconditions**:
- User has made at least 1 booking
**Steps**:
1. Navigate to /bookings
2. Click "View Details" on a booking
3. Observe all booking fields
**Expected Results**:
- Booking ID, reference, date created, status
- Event title, date, venue, price per ticket
- Customer details (name, email, phone)
- Quantity and total price
- "Check Refund Eligibility" button visible
- "Cancel Booking" button visible
**Business Rule**: User Journey (BR1)
**Suggested Layer**: E2E

### TC-004: User cancels a single booking and confirms
**Category**: Happy Path
**Priority**: P0
**Preconditions**:
- User has at least 1 booking
**Steps**:
1. Navigate to /bookings
2. Click "View Details" on the booking
3. Click "Cancel Booking"
4. Confirm cancellation in dialog
**Expected Results**:
- Booking deleted from database
- User redirected to /bookings list
- Booking no longer displayed in list
- For dynamic user-created events: available seats increase
- Toast message: "Booking cancelled successfully"
**Business Rule**: User Journey (BR1), Booking Limits (BR4)
**Suggested Layer**: E2E

### TC-005: User clears all bookings at once
**Category**: Happy Path
**Priority**: P1
**Preconditions**:
- User has 3+ bookings
**Steps**:
1. Navigate to /bookings
2. Click "Clear All Bookings" button
3. Confirm in dialog
**Expected Results**:
- All bookings deleted
- Bookings list becomes empty
- EmptyState component displays
- All seats freed for dynamic events
- Toast message: "All bookings cleared"
**Business Rule**: Booking Limits (BR4), User Journey (BR1)
**Suggested Layer**: E2E

### TC-006: User checks refund eligibility for 1 ticket (eligible)
**Category**: Happy Path
**Priority**: P1
**Preconditions**:
- User has booking with quantity = 1
**Steps**:
1. Navigate to /bookings
2. Click "View Details" on single-ticket booking
3. Click "Check Refund Eligibility"
4. Wait for 4-second spinner
**Expected Results**:
- Spinner displays for ~4 seconds
- After spinner: "Single-ticket bookings qualify for a full refund" message
- Message styling indicates eligible (green badge/text)
- Button becomes disabled or shows "Already checked"
**Business Rule**: Refund Eligibility (BR8)
**Suggested Layer**: E2E

### TC-007: User books second and third event successfully
**Category**: Happy Path
**Priority**: P1
**Preconditions**:
- User has 1 existing booking
- User has < 9 bookings total
**Steps**:
1. Navigate to /events
2. Book event A with quantity = 1
3. Book event B (different event) with quantity = 1
**Expected Results**:
- Both bookings created
- Each has unique booking reference
- /bookings shows both bookings
- Pagination still displays all (if total < 10)
**Business Rule**: User Journey (BR1), Booking Limits (BR4)
**Suggested Layer**: E2E

### TC-008: User books same event twice (same user, multiple bookings)
**Category**: Happy Path
**Priority**: P1
**Preconditions**:
- User is logged in
- Event has >= 2 available seats
**Steps**:
1. Navigate to /events
2. Book event A with quantity = 1
3. Return to /events
4. Book same event A again with quantity = 1
**Expected Results**:
- Two separate bookings created (different booking IDs and references)
- Both bookings appear in /bookings list
- Each has unique booking reference starting with event title letter
- Event seat count reduces by 2 total
**Business Rule**: Per-User Seat Availability (BR6)
**Suggested Layer**: E2E

---

## Business Rule Scenarios (TC-100-199)

### TC-100: Booking reference first letter matches event title
**Category**: Business Rule
**Priority**: P0
**Preconditions**:
- User books multiple events with different starting letters
**Steps**:
1. Book "Tech Summit" event (should start with T)
2. Book "Bollywood Night" (should start with B)  
3. Book "IPL Cricket" (should start with I)
4. Verify bookings in /bookings
**Expected Results**:
- Tech Summit booking ref starts with `T-`
- Bollywood Night booking ref starts with `B-`
- IPL Cricket booking ref starts with `I-`
**Business Rule**: Booking Reference Format (BR7)
**Suggested Layer**: API (GET /api/bookings)

### TC-101: Total price = event price × quantity
**Category**: Business Rule
**Priority**: P0
**Preconditions**:
- Event price is known (e.g., $299 Digital Marketing Workshop)
**Steps**:
1. Book event with quantity = 3
2. Navigate to booking details
3. Verify total price displayed
4. API call: GET /api/bookings/:id
**Expected Results**:
- UI displays: totalPrice = $299 × 3 = $897
- API response includes totalPrice: 897
- Price breakdown visible to user
**Business Rule**: Price Calculation (BR9)
**Suggested Layer**: E2E + API

### TC-102: Seat count reduces per user, not globally for dynamic events
**Category**: Business Rule
**Priority**: P1
**Preconditions**:
- User A creates event with 10 seats
- User A books 3 tickets
**Steps**:
1. User A views event: available seats = 10 - 3 = 7
2. User B (fresh login) views same event: available seats = 10
3. User B books 2 tickets
4. User B views event: available seats = 10 - 2 = 8
5. User A refreshes: still sees 7 (not affected by User B's booking)
**Expected Results**:
- Each user sees personalized seat count based on their own bookings
- No cross-user interference
**Business Rule**: Per-User Seat Availability (BR6)
**Suggested Layer**: E2E

### TC-103: Booking status is always "confirmed"
**Category**: Business Rule
**Priority**: P2
**Preconditions**:
- User has created booking
**Steps**:
1. Get booking via API: GET /api/bookings/:id
2. Inspect booking object
3. Frontend: view booking details page
**Expected Results**:
- API response: booking.status = "confirmed"
- Frontend displays "Status: Confirmed"
- No other status values exist in the system
**Business Rule**: Booking data model
**Suggested Layer**: API

### TC-104: FIFO booking pruning: oldest booking deleted when 10th created
**Category**: Business Rule
**Priority**: P1
**Preconditions**:
- User creates 9 bookings (all time gaps between them visible)
**Steps**:
1. User creates bookings 1-9 with identifiable event titles
2. Record creation timestamps
3. Create 10th booking (oldest should be pruned)
4. Verify bookings list after 10th creation
**Expected Results**:
- After 10th booking created, exactly 9 remain
- Booking #1 (oldest) is deleted
- Bookings #2-10 remain
- Toast or message indicates pruning (if visible)
**Business Rule**: Booking Limits - FIFO Pruning (BR4)
**Suggested Layer**: E2E + API

### TC-105: FIFO prefers deleting different-event booking over same-event
**Category**: Business Rule
**Priority**: P2
**Preconditions**:
- User has 9 bookings: 8 from Event X, 1 from Event Y (oldest)
**Steps**:
1. Create new booking for Event X (would hit FIFO limit)
2. Verify which booking was pruned
**Expected Results**:
- The oldest booking from Event Y is deleted (different event)
- Not the oldest booking from Event X
- New Event X booking can still complete
**Business Rule**: Booking Limits - FIFO Pruning (BR4)
**Suggested Layer**: API (POST /api/bookings)

### TC-106: Same-event FIFO fallback: permanent seat burn
**Category**: Business Rule
**Priority**: P2
**Preconditions**:
- User has 9 bookings all for Event X, FIFO trigger fires
- Event X has limited seats
**Steps**:
1. User attempts 10th booking (all 9 are for Event X)
2. FIFO fires, deletes oldest Event X booking
3. New booking created, seat count should decrease
4. User cancels new booking
**Expected Results**:
- On step 3: Event X seat count decreases (NOT restored)
- On step 4: Seat count does NOT restore
- Seat "permanently burned" per business logic
**Business Rule**: Booking Limits - FIFO Pruning (BR4)
**Suggested Layer**: API

### TC-107: Single ticket booking eligible for refund, multi-ticket is not
**Category**: Business Rule
**Priority**: P1
**Preconditions**:
- User has 2 bookings: one with qty=1, one with qty=3
**Steps**:
1. View booking with qty=1, check refund eligibility
2. View booking with qty=3, check refund eligibility
**Expected Results**:
- qty=1: "Single-ticket bookings qualify for a full refund"
- qty=3: "Group bookings (3 tickets) are non-refundable"
**Business Rule**: Refund Eligibility (BR8)
**Suggested Layer**: E2E

### TC-108: Refund check displays 4-second spinner before result
**Category**: Business Rule
**Priority**: P2
**Preconditions**:
- User has booking
**Steps**:
1. Click "Check Refund Eligibility"
2. Time the spinner duration
**Expected Results**:
- Spinner appears immediately
- Spinner animates for ~4 seconds
- Result message appears after ~4 seconds
- No console errors or timeout issues
**Business Rule**: Refund Eligibility (BR8)
**Suggested Layer**: E2E

---

## Security Scenarios (TC-200-299)

### TC-200: Cross-user booking access denied (403)
**Category**: Security
**Priority**: P0
**Preconditions**:
- User A creates booking with ID = 42
- User B is logged in
**Steps**:
1. User A captures booking ID: 42
2. Logout User A, clear localStorage
3. Login as User B
4. Navigate directly to /bookings/42
**Expected Results**:
- Access Denied message displayed
- Page does not render booking details
- API returns 403 Forbidden
**Business Rule**: User Sandbox Isolation (BR2)
**Suggested Layer**: E2E + API

### TC-201: Cross-user booking access via API denied (403)
**Category**: Security
**Priority**: P0
**Preconditions**:
- User A booking ID = 42
- User B JWT token known
**Steps**:
1. As User B, call: GET /api/bookings/42 (with User B's token)
2. Inspect response
**Expected Results**:
- HTTP 403 Forbidden
- Response message: "Forbidden" or "Access Denied"
- Booking details NOT returned
**Business Rule**: User Sandbox Isolation (BR2)
**Suggested Layer**: API

### TC-202: Unauthenticated user cannot access bookings
**Category**: Security
**Priority**: P0
**Preconditions**:
- No user logged in
**Steps**:
1. Navigate to /bookings (without JWT)
2. Attempt API call to GET /api/bookings without token
**Expected Results**:
- Frontend redirects to /login
- API returns 401 Unauthorized
- Booking data not exposed
**Business Rule**: Authentication (implied)
**Suggested Layer**: E2E + API

### TC-203: User cannot read booking by reference if not owner
**Category**: Security
**Priority**: P1
**Preconditions**:
- User A creates booking with reference = T-A3B2C1
- User B is logged in
**Steps**:
1. User A provides booking reference to User B
2. User B calls: GET /api/bookings/ref/T-A3B2C1 (with User B's token)
**Expected Results**:
- API returns 403 Forbidden
- Message: "You do not own this booking" or "Forbidden"
**Business Rule**: User Sandbox Isolation (BR2)
**Suggested Layer**: API

### TC-204: User cannot delete another user's booking
**Category**: Security
**Priority**: P1
**Preconditions**:
- User A booking ID = 42
- User B JWT token known
**Steps**:
1. As User B, call: DELETE /api/bookings/42 (with User B's token)
**Expected Results**:
- HTTP 403 Forbidden
- Booking NOT deleted
- User A's booking still exists
**Business Rule**: User Sandbox Isolation (BR2)
**Suggested Layer**: API

### TC-205: User cannot clear another user's bookings
**Category**: Security
**Priority**: P1
**Preconditions**:
- User A has 5 bookings
- User B JWT token known
**Steps**:
1. As User B, call: DELETE /api/bookings (clear all, User B token)
2. Verify User A's bookings remain
**Expected Results**:
- Only User B's bookings (if any) are cleared
- User A's 5 bookings untouched
- No cross-user data loss
**Business Rule**: User Sandbox Isolation (BR2)
**Suggested Layer**: API

---

## Negative/Error Scenarios (TC-300-399)

### TC-300: Insufficient seats available (exact boundary)
**Category**: Negative
**Priority**: P0
**Preconditions**:
- Event has 3 available seats for the user
**Steps**:
1. Attempt to book 4 tickets
2. Click "Confirm Booking"
**Expected Results**:
- Error toast: "Only 3 seat(s) available, but 4 requested"
- Booking not created
- Seat count unchanged
- Form remains prefilled for correction
**Business Rule**: Per-User Seat Availability (BR6)
**Suggested Layer**: E2E

### TC-301: Insufficient seats available (user's personal availability)
**Category**: Negative
**Priority**: P1
**Preconditions**:
- Static event shows 100 available seats
- User A already booked 50
- User A's personal availability = 100 - 50 = 50
**Steps**:
1. User A attempts booking quantity = 51
**Expected Results**:
- Booking fails
- Message: "Only 50 seat(s) available, but 51 requested"
- Event still shows 100 total available
**Business Rule**: Per-User Seat Availability (BR6)
**Suggested Layer**: API + E2E

### TC-302: Booking fails when event not found
**Category**: Negative
**Priority**: P1
**Preconditions**:
- Event ID 999999 does not exist
**Steps**:
1. API call: POST /api/bookings with eventId = 999999
2. Or: Direct URL navigation to /events/999999
**Expected Results**:
- API: HTTP 404 with message "Event not found"
- Frontend: "Event not found" message or redirect to /events
**Business Rule**: Event validation (implied)
**Suggested Layer**: API + E2E

### TC-303: Booking fails with invalid customer email
**Category**: Negative
**Priority**: P1
**Preconditions**:
- User attempts booking with invalid email
**Steps**:
1. Enter customer email = "invalid-email" (no @)
2. Click "Confirm Booking"
**Expected Results**:
- Validation error on form
- Message: "Please enter a valid email"
- Booking not submitted
**Business Rule**: Input Validation (implied)
**Suggested Layer**: E2E

### TC-304: Booking fails with invalid customer phone (< 10 digits)
**Category**: Negative
**Priority**: P1
**Preconditions**:
- User enters phone with < 10 digits
**Steps**:
1. Enter customer phone = "12345"
2. Click "Confirm Booking"
**Expected Results**:
- Validation error: "Phone must be at least 10 digits"
- Booking not created
**Business Rule**: Input Validation (implied)
**Suggested Layer**: E2E

### TC-305: Booking fails with customer name < 2 characters
**Category**: Negative
**Priority**: P1
**Preconditions**:
- User enters 1-character name
**Steps**:
1. Enter customer name = "A"
2. Click "Confirm Booking"
**Expected Results**:
- Validation error: "Name must be at least 2 characters"
- Booking not created
**Business Rule**: Input Validation (implied)
**Suggested Layer**: E2E

### TC-306: Booking fails with quantity < 1
**Category**: Negative
**Priority**: P1
**Preconditions**:
- Quantity buttons start at 1
**Steps**:
1. Attempt to set quantity to 0 (via URL or API)
**Expected Results**:
- UI prevents - button disabled at quantity = 1
- API: HTTP 400 "Quantity must be >= 1"
**Business Rule**: Input Validation (implied)
**Suggested Layer**: E2E + API

### TC-307: Booking fails with quantity > 10
**Category**: Negative
**Priority**: P1
**Preconditions**:
- User attempts to book > 10 tickets
**Steps**:
1. Try to set quantity to 11 via +/- buttons
2. Or: API call with quantity = 11
**Expected Results**:
- UI prevents - + button disabled at quantity = 10
- API: HTTP 400 "Quantity must be <= 10"
- Booking not created
**Business Rule**: Input Validation (implied)
**Suggested Layer**: E2E + API

### TC-308: Cancel booking fails if booking not found
**Category**: Negative
**Priority**: P2
**Preconditions**:
- Booking ID 999999 does not exist
**Steps**:
1. API call: DELETE /api/bookings/999999
**Expected Results**:
- HTTP 404 "Booking not found"
- No error on frontend if user doesn't attempt this manually
**Business Rule**: Error handling (implied)
**Suggested Layer**: API

### TC-309: Missing required fields in booking form
**Category**: Negative
**Priority**: P1
**Preconditions**:
- User attempts booking without filling all fields
**Steps**:
1. Skip entering customer name, leave blank
2. Click "Confirm Booking"
**Expected Results**:
- Validation error: "Name is required"
- Booking not submitted
**Business Rule**: Input Validation (implied)
**Suggested Layer**: E2E

### TC-310: Booking fails if customer phone is non-numeric
**Category**: Negative
**Priority**: P2
**Preconditions**:
- User enters phone with letters/special chars
**Steps**:
1. Enter customer phone = "123-456-ABC123"
2. Click "Confirm Booking"
**Expected Results**:
- Validation error (if backend enforces) or booking passes (if only length checked)
- Document backend behavior
**Business Rule**: Input Validation (implementation-specific)
**Suggested Layer**: E2E + API

---

## Edge Case Scenarios (TC-400-499)

### TC-400: User books exactly 9th booking (limit boundary)
**Category**: Edge Case
**Priority**: P1
**Preconditions**:
- User has 8 bookings
**Steps**:
1. Create 9th booking
2. Verify in /bookings list
**Expected Results**:
- All 9 bookings display
- No warning or error
- Booking counter shows "9 bookings"
- Pagination at 1 page (if 9 items per page)
**Business Rule**: Booking Limits (BR4)
**Suggested Layer**: E2E

### TC-401: User books with quantity = 10 (max quantity boundary)
**Category**: Edge Case
**Priority**: P1
**Preconditions**:
- Event has >= 10 available seats
**Steps**:
1. Set quantity to 10 using + button
2. Confirm booking
**Expected Results**:
- Booking created with quantity = 10
- + button disabled (can't go higher)
- Seat count reduces by 10
**Business Rule**: Input Validation (implied)
**Suggested Layer**: E2E

### TC-402: User books with quantity = 1 (min quantity boundary)
**Category**: Edge Case
**Priority**: P1
**Preconditions**:
- Event available
**Steps**:
1. Set quantity to 1 (default)
2. Confirm booking
**Expected Results**:
- Booking created with quantity = 1
- - button disabled (can't go lower)
- Eligible for refund (BR8)
**Business Rule**: Refund Eligibility (BR8)
**Suggested Layer**: E2E

### TC-403: Event title with 1-character name for booking reference
**Category**: Edge Case
**Priority**: P2
**Preconditions**:
- Admin creates event with title = "X"
- User books
**Steps**:
1. Create user-created event with title "X"
2. Book the event
3. Check booking reference
**Expected Results**:
- Booking reference starts with `X-` (not sanitized)
- Format valid: `X-[6_CHARS]`
**Business Rule**: Booking Reference Format (BR7)
**Suggested Layer**: E2E + API

### TC-404: Event title with special characters for booking reference
**Category**: Edge Case
**Priority**: P2
**Preconditions**:
- Admin creates event with title = "#1 #1 Top Event"
**Steps**:
1. Create event with title "#1 #1 Top Event"
2. User books
3. Check booking reference
**Expected Results**:
- Booking reference starts with `#-` (first char of title, uppercase)
- Format: `#-[6_CHARS]`
**Business Rule**: Booking Reference Format (BR7)
**Suggested Layer**: API

### TC-405: Zero quantity edge case (boundary test)
**Category**: Edge Case
**Priority**: P2
**Preconditions**:
- Direct API call with quantity = 0
**Steps**:
1. API: POST /api/bookings with quantity = 0
**Expected Results**:
- Validation fails
- HTTP 400: "Quantity must be >= 1"
**Business Rule**: Input Validation (implied)
**Suggested Layer**: API

### TC-406: Negative quantity edge case
**Category**: Edge Case
**Priority**: P2
**Preconditions**:
- Direct API call with quantity = -5
**Steps**:
1. API: POST /api/bookings with quantity = -5
**Expected Results**:
- Validation fails
- HTTP 400: "Quantity must be >= 1"
**Business Rule**: Input Validation (implied)
**Suggested Layer**: API

### TC-407: Very long customer name (edge case)
**Category**: Edge Case
**Priority**: P2
**Preconditions**:
- User enters 255+ character name
**Steps**:
1. Enter very long customer name
2. Confirm booking
**Expected Results**:
- Either truncated to max length OR accepted as-is
- Booking created successfully
- No truncation issues in display
**Business Rule**: Data model (implementation-specific)
**Suggested Layer**: E2E

### TC-408: Email with unusual but valid format
**Category**: Edge Case
**Priority**: P2
**Preconditions**:
- User enters valid but unusual email
**Steps**:
1. Enter email: "test+tag123@sub.example.co.uk"
2. Confirm booking
**Expected Results**:
- Email validation passes
- Booking created
- Email stored correctly in database
**Business Rule**: Email validation (implied)
**Suggested Layer**: E2E + API

### TC-409: Phone with leading zeros
**Category**: Edge Case
**Priority**: P2
**Preconditions**:
- User enters phone = "0912345678" (10 digits with leading 0)
**Steps**:
1. Enter customer phone = "0912345678"
2. Confirm booking
**Expected Results**:
- Validation passes (meets 10-digit requirement)
- Booking created
- Phone stored as-is (not converted to integer)
**Business Rule**: Phone validation (implied)
**Suggested Layer**: E2E

### TC-410: User at exactly 9 bookings, all from different events
**Category**: Edge Case
**Priority**: P2
**Preconditions**:
- User creates 9 bookings from 9 different events
**Steps**:
1. Verify all 9 display in /bookings
2. Create 10th booking
3. Verify FIFO pruning
**Expected Results**:
- All 9 display on one page (or paginated if needed)
- 10th booking triggers FIFO
- Oldest booking deleted
- 9 remain
**Business Rule**: Booking Limits (BR4)
**Suggested Layer**: E2E

---

## UI State Scenarios (TC-500-599)

### TC-500: Bookings page empty state when user has no bookings
**Category**: UI State
**Priority**: P1
**Preconditions**:
- Fresh user account with 0 bookings
**Steps**:
1. Navigate to /bookings
2. Observe page state
**Expected Results**:
- EmptyState component displays
- Message: "No bookings yet" or similar
- "Explore Events" button visible
- No booking cards displayed
- Pagination hidden
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-501: Bookings page loading state while fetching
**Category**: UI State
**Priority**: P2
**Preconditions**:
- User has bookings
- Network throttled or slow backend
**Steps**:
1. Navigate to /bookings
2. Observe loading phase
3. Wait for bookings to load
**Expected Results**:
- Spinner/skeleton displayed while fetching
- No booking cards until loaded
- After load: bookings render correctly
- No layout shift
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-502: Booking cards display all required info on list view
**Category**: UI State
**Priority**: P1
**Preconditions**:
- User has 1+ booking
**Steps**:
1. Navigate to /bookings
2. Inspect booking card
**Expected Results**:
- Event title displayed
- Booking reference displayed
- Quantity displayed
- Total price displayed
- Status ("Confirmed") displayed
- "View Details" link/button visible
- Event date visible
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-503: Booking detail page shows all fields
**Category**: UI State
**Priority**: P1
**Preconditions**:
- User has booking
**Steps**:
1. Navigate to /bookings
2. Click "View Details"
**Expected Results**:
- Booking ID visible
- Booking reference visible
- Booking status visible
- Customer name, email, phone visible
- Event title, date, venue visible
- Event price, quantity, total price visible
- "Cancel Booking" button visible
- "Check Refund Eligibility" button visible
- Back button or link visible
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-504: Refund eligibility button disabled after checked
**Category**: UI State
**Priority**: P2
**Preconditions**:
- User on booking detail page
**Steps**:
1. Click "Check Refund Eligibility"
2. Wait for spinner and result
3. Observe button state
**Expected Results**:
- Button becomes disabled OR shows "Already Checked"
- User cannot re-check (or multiple checks are allowed per requirements)
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-505: Booking list pagination with 10+ bookings
**Category**: UI State
**Priority**: P2
**Preconditions**:
- User has 10 bookings (limit is 9, so only 9 should exist at once)
- OR simulate pagination by reducing page size
**Steps**:
1. Navigate to /bookings
2. Observe pagination controls
3. Click next page (if applicable)
**Expected Results**:
- First page shows 9 bookings (or per-page limit)
- Pagination visible if total > limit
- Next/Previous buttons functional
- Current page number displayed
- Total count shown (e.g., "Showing 9 of 9")
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-506: Cancel booking confirmation dialog
**Category**: UI State
**Priority**: P1
**Preconditions**:
- User on booking detail page
**Steps**:
1. Click "Cancel Booking"
2. Observe dialog
3. Click "Confirm"
**Expected Results**:
- Modal/dialog appears with warning
- Message: "Are you sure you want to cancel this booking?"
- Booking reference shown in dialog
- "Cancel" (abort) and "Confirm" buttons visible
- Dialog closes after confirmation
- Redirected to /bookings list
- Booking removed
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-507: Clear all bookings confirmation dialog
**Category**: UI State
**Priority**: P1
**Preconditions**:
- User on /bookings with 3+ bookings
**Steps**:
1. Click "Clear All Bookings"
2. Observe dialog
3. Click "Confirm"
**Expected Results**:
- Modal appears with bold warning
- Message: "Clear ALL bookings? This cannot be undone."
- Booking count mentioned (e.g., "You have 5 bookings")
- "Cancel" and "Confirm" buttons visible
- After confirm: all bookings deleted, empty state shown
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-508: Toast messages on booking creation
**Category**: UI State
**Priority**: P1
**Preconditions**:
- User completes booking
**Steps**:
1. Fill booking form
2. Click "Confirm Booking"
3. Observe toast notification
**Expected Results**:
- Green/success toast appears
- Message: "Booking confirmed successfully!" or similar
- Toast auto-dismisses after 3-5 seconds
- Toast positioned at top/bottom of screen
- No overlapping with content
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-509: Toast messages on booking cancellation
**Category**: UI State
**Priority**: P1
**Preconditions**:
- User cancels booking
**Steps**:
1. Click "Cancel Booking"
2. Confirm in dialog
3. Observe toast
**Expected Results**:
- Green/success toast appears
- Message: "Booking cancelled successfully!"
- Auto-dismisses
- Redirects to /bookings
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-510: Error toast for insufficient seats
**Category**: UI State
**Priority**: P1
**Preconditions**:
- Event has < requested quantity
**Steps**:
1. Attempt booking with quantity > available
2. Click "Confirm Booking"
3. Observe error
**Expected Results**:
- Red/error toast appears
- Message: "Only N seat(s) available, but X requested"
- Form remains visible with values prefilled
- User can adjust quantity and retry
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-511: Booking list filters/sort by date
**Category**: UI State
**Priority**: P2
**Preconditions**:
- User has 3+ bookings from different dates
**Steps**:
1. Navigate to /bookings
2. Click "Sort by Date" or similar control
3. Observe order
**Expected Results**:
- Bookings sorted by creation date (if sort feature exists)
- Newest first OR oldest first (depends on sort direction)
- Sort indicator shown (arrow or label)
- Multiple clicks toggle direction
**Business Rule**: UI State (implementation-specific)
**Suggested Layer**: E2E

### TC-512: Sandbox warning banner on bookings page
**Category**: UI State
**Priority**: P2
**Preconditions**:
- User has 7+ bookings OR close to 9 limit
**Steps**:
1. Navigate to /bookings
2. Observe top of page
**Expected Results**:
- Banner displays: "Sandbox holds up to 9 bookings"
- Warning styling (yellow/orange background)
- Banner auto-dismisses OR persistent
- Does NOT appear if count < threshold
**Business Rule**: Sandbox Warning Banners (BR5)
**Suggested Layer**: E2E

### TC-513: Refund eligibility message styling for eligible
**Category**: UI State
**Priority**: P2
**Preconditions**:
- Single-ticket booking (qty=1)
**Steps**:
1. Click "Check Refund Eligibility"
2. Wait for result
3. Observe message styling
**Expected Results**:
- Message text: "Single-ticket bookings qualify for a full refund"
- Green badge or green text color
- Checkmark icon present
- Distinct from non-eligible styling
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

### TC-514: Refund eligibility message styling for non-eligible
**Category**: UI State
**Priority**: P2
**Preconditions**:
- Multi-ticket booking (qty>1)
**Steps**:
1. Click "Check Refund Eligibility"
2. Wait for result
3. Observe message styling
**Expected Results**:
- Message text: "Group bookings (X tickets) are non-refundable"
- Red badge or red/orange text color
- X icon present
- Distinct from eligible styling
**Business Rule**: UI State (implied)
**Suggested Layer**: E2E

---

## Summary Statistics

| Category | Count | Priority Breakdown |
|---|---|---|
| Happy Path (001-099) | 8 | P0: 4, P1: 4 |
| Business Rules (100-199) | 9 | P0: 3, P1: 4, P2: 2 |
| Security (200-299) | 6 | P0: 3, P1: 3 |
| Negative (300-399) | 11 | P0: 1, P1: 8, P2: 2 |
| Edge Cases (400-499) | 11 | P1: 3, P2: 8 |
| UI State (500-599) | 15 | P0: 0, P1: 7, P2: 8 |
| **Total** | **60** | **P0: 11, P1: 29, P2: 20** |

---

## Suggested Test Pyramid Distribution

- **E2E Tests**: TC-001-009, TC-100, TC-102, TC-103, TC-200, TC-300, TC-400, TC-500-514 (Highest impact user flows)
- **API Tests**: TC-100-108, TC-200-205, TC-300-310, TC-400-406 (Boundary + error handling)
- **Component Tests**: TC-500-514 (UI state and rendering)
- **Unit Tests**: Input validation, booking reference generation, price calculation

---

## Key Validations to Automate

1. **Booking reference format**: `[LETTER]-[6_ALPHANUMERIC]` match
2. **Price calculation**: `totalPrice === event.price * quantity`
3. **FIFO pruning**: oldest booking deleted when 10th created
4. **Seat availability**: per-user computation accuracy
5. **Refund eligibility**: message accuracy for qty=1 vs qty>1
6. **Cross-user isolation**: 403 Forbidden on unauthorized access
7. **EmptyState rendering**: correct display when no bookings
8. **Toast notifications**: appropriate message and styling for success/error scenarios

