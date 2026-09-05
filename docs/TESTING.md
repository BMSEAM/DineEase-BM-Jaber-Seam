# DineEase Testing Documentation

## 1. Testing Strategy
DineEase uses a combination of automated backend testing and manual integration/frontend testing.
- **Backend**: Automated unit and integration tests using Jest and Supertest.
- **Frontend**: Manual end-to-end testing and production build verification.
- **Dependencies**: Verified via `npm audit` and clean installations.

## 2. Automated Tests (Backend)

The backend Express application includes automated tests for critical modules.
To run the automated tests, ensure dependencies are installed and run the following command from the root directory:
```bash
npm --workspace server test
```

### Test Suites Included:
1. `tests/auth.test.js`: Verifies user registration, login, and role-based access.
2. `tests/reservation.test.js`: Verifies table reservation creation and validation.
3. `tests/reservation.history.test.js`: Verifies fetching reservation history for users.
4. `tests/refund.test.js`: Verifies refund processing logic.
5. `tests/defects.test.js`: Regression tests for known historical bugs.
6. `tests/integrity.test.js`: General system integrity checks.

### Current Automated Test Results:
- **Total Tests**: 75
- **Status**: PASS

## 3. Frontend Build Verification

To ensure the React frontend is production-ready, run the Vite build process:
```bash
npm --workspace client run build
```
### Current Build Results:
- **Status**: PASS
- **Note**: The frontend builds successfully without any blocking fatal errors.

## 4. Manual Testing Checklist

Below is the manual testing checklist for verifying the full DineEase application.

| Feature | Role Needed | Expected Result | Actual Result | Status |
|---------|-------------|-----------------|---------------|--------|
| **Authentication** | Any | Users can register, log in, and receive a valid JWT token. | Works as expected. | PASS |
| **F01 Menu** | Customer | Customers can view the menu items. | Works as expected. | PASS |
| **F03 Reservation** | Customer | Customers can successfully book a table. | Works as expected. | PASS |
| **F09 Reservation Approval** | Staff | Staff can see incoming reservations and approve them. | Works as expected. | PASS |
| **F12 Menu Management** | Admin | Admins can add new items to the menu. | Works as expected. | PASS |
| **F16 Digital Payment**| Customer | Customers can click pay and complete the simulated flow. | Works as expected. | PASS |
| **F18 Admin Dashboard**| Admin | Admins can view high-level metrics. | Works as expected. | PASS |

## 5. Environment Configuration

### Required Backend Environment Variables:
The backend requires a `.env` file in the `server/` directory:
- `PORT`: Server port (default 5000)
- `MONGODB_URI`: Valid MongoDB connection string
- `JWT_SECRET`: Secure secret for signing tokens
- `NODE_ENV`: Should be `development` or `production`

### Required Frontend Environment Variables:
The frontend requires a `.env` file in the `client/` directory:
- `VITE_API_URL`: The URL pointing to the backend (e.g., `http://localhost:5000/api/v1`)

## 6. Known Limitations
- The Digital Payment (F16) feature uses a simulated flow and does not process real transactions or connect to an external banking gateway (as per project constraints).
- Real-time notifications (F11) may require page refreshes depending on the current WebSocket integration status in the environment.
