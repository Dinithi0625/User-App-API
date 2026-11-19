# Gardino User App — Coursework Frontend

This project adapts the visual direction of the uploaded Plant Care mobile app into a browser-based User Management frontend for the FreeProjectAPI **User App** module.

## Technology
- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript (ES6+)
- Fetch API
- FreeProjectAPI UserApp REST endpoints

## Run
1. Extract the ZIP.
2. Open the folder in VS Code.
3. Run `index.html` with the VS Code Live Server extension, or serve the folder with any local static web server.
4. Open `js/api.js` and check `API_BASE`.
5. Use test-only account data. This is a shared practice API; do not submit private or sensitive information.

## API host
The FreeProjectAPI User App practice documentation shows requests using:
`https://api.freeprojectapi.com/api/UserApp/...`

The base host is configured in `js/api.js`:
`https://api.freeprojectapi.com`

## Implemented UserApp endpoints
- POST `/api/UserApp/CreateNewUser`
- POST `/api/UserApp/login`
- POST `/api/UserApp/refresh`
- GET `/api/UserApp/GetAllUsers`
- GET `/api/UserApp/searchUsers?searchText=&pageNumber=&pageSize=`
- POST `/api/UserApp/send-reset-otp?emailId=`
- POST `/api/UserApp/verify-otp-reset-password`
- PUT `/api/UserApp/update-password/{customerId}`

## Important schema note
The coursework documentation supplied in the conversation specifies the endpoint paths and some fields, but does not show complete request-body schemas for CreateNewUser, verify-otp-reset-password, or update-password. The frontend currently uses these conventional body shapes:
- Register: `{ fullName, emailId, mobileNo, password }`
- Verify/reset: `{ emailId, otp, newPassword }`
- Update password: `{ currentPassword, newPassword }`

Confirm these three request bodies against the live FreeProjectAPI endpoint tester / current API schema before final submission. If the provider uses different property names, edit the corresponding body object in `js/app.js`. The login body `{ emailId, password }` and refresh body `{ emailId, token, refreshToken }` follow the coursework documentation.

## Notes
- Access and refresh tokens are stored in `sessionStorage` as requested by the coursework guide.
- The app handles HTTP errors and the API wrapper's `result: false` response.
- User directory fields are mapped defensively because the API response schema may vary.
- The API is shared and its availability, CORS policy, and data persistence are controlled by the provider.
- Do not use real personal passwords or private details in a learning/demo API.
