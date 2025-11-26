# Desktop App Authentication System

## Overview
The desktop app uses **localStorage** for token storage (instead of cookies like the web app), implementing the same authentication logic and token management strategy.

## Architecture

### Token Storage
- **Location**: `localStorage` (browser storage)
- **Keys**: 
  - `loop_access_token` - Short-lived access token (15 minutes)
  - `loop_refresh_token` - Long-lived refresh token (7 days)

### Authentication Flow

#### 1. **Sign In**
```typescript
// User enters credentials
signIn(email, password) →
  ├─ API: POST /auth/sign-in
  ├─ Receive: accessToken + refreshToken
  ├─ Save to localStorage
  └─ Navigate to Home
```

#### 2. **App Startup - Token Validation**
```typescript
// On app load
checkAuthStatus() →
  ├─ Get tokens from localStorage
  ├─ If no tokens → Show Sign In
  ├─ If accessToken exists:
  │   ├─ Validate token: GET /auth/validate-token
  │   ├─ If valid → Load user data + Navigate to Home
  │   └─ If invalid → Try refresh
  └─ If refreshToken exists:
      ├─ Refresh: POST /auth/refresh-token
      ├─ Get new accessToken
      ├─ Save to localStorage
      └─ Load user data + Navigate to Home
```

#### 3. **Token Refresh**
```typescript
// When accessToken expires
refreshAccessToken(refreshToken) →
  ├─ API: POST /auth/refresh-token
  ├─ Receive: new accessToken
  ├─ Save to localStorage
  └─ Continue session
```

#### 4. **Sign Out**
```typescript
signOut() →
  ├─ Clear accessToken from localStorage
  ├─ Clear refreshToken from localStorage
  └─ Navigate to Sign In
```

## Files Structure

### `/desktop/src/utils/auth.ts`
Core authentication utilities:
- `saveTokens()` - Save tokens to localStorage
- `getAccessToken()` - Get access token from localStorage
- `getRefreshToken()` - Get refresh token from localStorage
- `clearTokens()` - Remove all tokens
- `validateToken()` - Validate access token with backend
- `refreshAccessToken()` - Refresh access token using refresh token
- `checkAuthStatus()` - Check authentication status on app startup
- `signIn()` - Sign in user with email/password
- `signUp()` - Register new user
- `signOut()` - Sign out and clear tokens

### `/desktop/src/store/userStore.ts`
User data management:
- `UserData` type definition
- `getAvatarUrl()` - Get user avatar URL
- `getAvatarFallback()` - Get avatar fallback text

### `/desktop/src/App.tsx`
Main app component with authentication:
- `isAuthenticated` - Authentication state
- `userData` - Current user data
- `isLoading` - Loading state during token validation
- Auto-validation on startup
- Protected route logic

## Key Differences from Web App

| Feature | Web App | Desktop App |
|---------|---------|-------------|
| **Token Storage** | Cookies (`document.cookie`) | localStorage |
| **Routing** | React Router | State-based navigation |
| **Token Access** | `getCookie()` function | `localStorage.getItem()` |
| **Token Persistence** | HTTP-only cookies | localStorage |
| **Security** | Cookie flags (Secure, SameSite) | localStorage (less secure) |

## Security Considerations

### localStorage Limitations
⚠️ **Warning**: localStorage is vulnerable to XSS attacks. Tokens stored in localStorage can be accessed by any JavaScript code on the page.

**Recommendations:**
1. Implement Content Security Policy (CSP)
2. Sanitize all user inputs
3. Use HTTPS only
4. Consider moving to more secure storage if needed

### Token Expiration
- **Access Token**: 15 minutes (0.01 days)
- **Refresh Token**: 7 days
- Tokens automatically refresh when expired

## Environment Variables

Create a `.env` file in the desktop app:

```env
VITE_SERVER_URL=http://localhost:3000
```

## Usage Example

### Sign In
```typescript
import { signIn } from './utils/auth';

const result = await signIn('user@example.com', 'password123');
if (result.success) {
  // User is authenticated, tokens are saved
  console.log(result.userData);
}
```

### Check Auth Status
```typescript
import { checkAuthStatus } from './utils/auth';

const { isAuthenticated, userData } = await checkAuthStatus();
if (isAuthenticated) {
  // User is logged in
  console.log(userData);
}
```

### Sign Out
```typescript
import { signOut } from './utils/auth';

signOut(); // Clears all tokens and logs out
```

## Testing

### Manual Testing Steps
1. **First Time Sign In**
   - Open app → Should show Sign In page
   - Enter credentials → Click Sign In
   - Should navigate to Home page
   - Check localStorage → Should contain tokens

2. **Token Persistence**
   - Close and reopen app
   - Should automatically load Home page (tokens valid)

3. **Token Expiration**
   - Wait 15+ minutes
   - Interact with app
   - Should automatically refresh token
   - Should continue session

4. **Sign Out**
   - Click Sign Out button
   - Should clear tokens
   - Should navigate to Sign In page
   - Reopen app → Should show Sign In page

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/sign-in` | POST | Authenticate user and get tokens |
| `/auth/sign-up` | POST | Register new user |
| `/auth/validate-token` | GET | Validate access token |
| `/auth/refresh-token` | POST | Refresh access token |

## Error Handling

All authentication functions return standardized responses:

```typescript
{
  success: boolean;
  error?: string;
  userData?: UserData;
}
```

Errors are displayed to users via:
- Toast notifications (if implemented)
- Error messages in forms
- Console logs for debugging

