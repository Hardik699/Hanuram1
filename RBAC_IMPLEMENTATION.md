# Role-Based Access Control (RBAC) Implementation Guide

## Overview

The application now implements a complete Role-Based Access Control (RBAC) system with 5 roles, 19 permissions, and full backend/frontend integration.

## Architecture

### Backend

#### Database Collections

1. **roles** - Stores role definitions
   ```
   { _id: 1, role_name: "Super Admin" }
   { _id: 2, role_name: "Admin" }
   { _id: 3, role_name: "Manager" }
   { _id: 4, role_name: "Vendor" }
   { _id: 5, role_name: "Viewer" }
   ```

2. **permissions** - Stores permission definitions
   ```
   19 permissions including:
   - dashboard_view, rm_view, rm_add, rm_edit
   - recipe_view, recipe_add, recipe_edit
   - category_view, category_add, subcategory_view, subcategory_add
   - unit_view, unit_add, vendor_view, vendor_add, vendor_edit
   - quotation_view, quotation_add, user_manage
   ```

3. **role_permissions** - Junction table linking roles to permissions
   ```
   { role_id: 1, permission_id: 1 } // Role to permission mapping
   ```

4. **users** - Updated user structure
   ```
   {
     _id: ObjectId,
     username: string,
     email: string,
     password: string (hashed in production),
     role_id: number,
     status: "active" | "blocked",
     createdAt: Date
   }
   ```

#### API Routes

**Authentication:**
- `POST /api/login` - Returns user with permissions

**User Management (requires user_manage permission):**
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:userId/role` - Update user role
- `PUT /api/users/:userId/status` - Update user status (active/blocked)
- `DELETE /api/users/:userId` - Delete user
- `GET /api/roles` - Get all roles

#### Middleware

- **requireAuth** - Checks if user is authenticated
- **requirePermission(permission)** - Checks if user has specific permission

#### Utilities (server/rbac.ts)

- `getUserPermissions(roleId)` - Get all permissions for a role
- `hasPermission(roleId, permission)` - Check single permission
- `hasAnyPermission(roleId, permissions[])` - Check any of multiple permissions
- `hasAllPermissions(roleId, permissions[])` - Check all permissions

### Frontend

#### Auth Context (client/context/AuthContext.tsx)

Manages user state and authentication:
- `user: User | null` - Current user object with permissions
- `login(username, password)` - Authenticate user
- `logout()` - Clear user and tokens
- `isAuthenticated: boolean` - Auth state
- `hasPermission(permission)` - Check if user has permission
- `loading: boolean` - Loading state

#### Hooks

**useAuth()** - Access auth context
```typescript
const { user, login, logout, isAuthenticated, hasPermission } = useAuth();
```

#### Components

**PermissionGate** - Conditional rendering based on permissions
```typescript
<PermissionGate permission="rm_add">
  <button>Add Raw Material</button>
</PermissionGate>

// Multiple permissions (any)
<PermissionGate permission={["rm_add", "rm_edit"]}>
  <button>Modify Raw Material</button>
</PermissionGate>

// All permissions required
<PermissionGate permission={["rm_add", "rm_edit"]} requireAll>
  <button>Full Access</button>
</PermissionGate>
```

**ProtectedRoute** - Route protection wrapper
```typescript
<ProtectedRoute requiredPermission="category_add">
  <CreateCategory />
</ProtectedRoute>
```

#### Integration

- **Sidebar** filters menu items based on user permissions
- **Login** page updated to use useAuth hook
- **App.tsx** wraps all protected routes with ProtectedRoute
- **LocalStorage** persists user and token data

## Role Permissions Matrix

### Super Admin
- ✅ All permissions (1-19)

### Admin
- dashboard_view
- rm_view, rm_add, rm_edit
- recipe_view, recipe_add, recipe_edit
- category_view, category_add
- unit_view, unit_add
- vendor_view, vendor_add, vendor_edit
- quotation_view, quotation_add

### Manager
- dashboard_view
- rm_view
- recipe_view
- quotation_view

### Vendor
- vendor_view
- quotation_view

### Viewer
- dashboard_view
- rm_view
- recipe_view

## Testing Guide

### 1. Login Test
**Default Credentials:**
- Username: `Hanuram`
- Password: `HAnuram@214#`
- Role: Super Admin (role_id: 1)

**Expected:** Login redirects to /raw-materials with all permissions

### 2. Permission Verification
After login, check browser console:
```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('user'));
console.log(user.permissions); // Should show array of permission keys
```

### 3. Sidebar Menu Test
- Super Admin: See all menu items
- Other roles: See filtered menu items based on their permissions

### 4. Route Protection Test
- Try accessing `/recipe/new` without recipe_add permission
- Expected: Redirect or show "Access Denied"

### 5. API Test (cURL)
```bash
# Login
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Hanuram","password":"HAnuram@214#"}'

# Response should include user with permissions:
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "username": "Hanuram",
    "email": "hanuram@faction.local",
    "role_id": 1,
    "permissions": ["dashboard_view", "rm_view", ...]
  },
  "token": "..."
}
```

### 6. User Management Test
```bash
# Get all users (requires user_manage permission)
curl http://localhost:8080/api/users \
  -H "x-user: Hanuram"

# Create new user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -H "x-user: Hanuram" \
  -d '{
    "username":"john",
    "email":"john@example.com",
    "password":"password123",
    "role_id":3
  }'

# Update user role
curl -X PUT http://localhost:8080/api/users/{userId}/role \
  -H "Content-Type: application/json" \
  -H "x-user: Hanuram" \
  -d '{"role_id":2}'
```

## Security Notes

1. **Passwords**: Currently stored in plain text. In production:
   - Use bcrypt or similar for hashing
   - Never store plain text passwords

2. **Tokens**: Current implementation uses base64. In production:
   - Use JWT with proper expiration
   - Validate token on each request

3. **Frontend Security**: PermissionGate is for UX only
   - Always validate permissions on backend
   - Frontend checks can be bypassed

4. **Backend Security**: All API endpoints check permissions
   - requirePermission middleware validates on server
   - Frontend and backend checks are independent

## Future Enhancements

1. **JWT Implementation**
   - Add expiration times
   - Implement refresh tokens
   - Validate tokens on protected routes

2. **Password Hashing**
   - Integrate bcrypt
   - Add password reset functionality
   - Implement password policies

3. **Audit Logging**
   - Log all permission checks
   - Track user actions
   - Monitor security events

4. **Dynamic Permissions**
   - Allow admins to create custom permissions
   - Modify role permissions at runtime
   - User-specific permissions

5. **Session Management**
   - Track active sessions
   - Allow force logout
   - Implement session timeout

## File Structure

```
server/
  rbac.ts                    # RBAC utility functions
  middleware/
    authMiddleware.ts        # Auth & permission middleware
  routes/
    login.ts                 # Updated with permissions
    users.ts                 # User management routes
  db.ts                      # Updated collections init

client/
  context/
    AuthContext.tsx          # Auth state management
  hooks/
    useAuth.ts              # useAuth hook
  components/
    PermissionGate.tsx      # Conditional rendering
    ProtectedRoute.tsx      # Route protection
    Sidebar.tsx             # Updated with permissions
  pages/
    Login.tsx               # Updated with useAuth

shared/
  api.ts                    # Updated types
```

## Troubleshooting

### Issue: "User not found" error on login
- Check username case sensitivity
- Verify user exists in MongoDB

### Issue: Permissions not loading
- Check MongoDB role_permissions collection
- Verify role_id in users collection

### Issue: Routes show "Access Denied"
- Check ProtectedRoute requiredPermission prop
- Verify user has permission in login response

### Issue: Sidebar menu items not showing
- Check PermissionGate implementation
- Verify hasPermission hook is working
- Check browser console for errors
