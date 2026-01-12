# Admin User Setup Guide

This guide explains how to create an admin user for the AttendIQ system.

## Prerequisites

1. Database migrations must be run to add the ADMIN role to the UserRole enum
2. Node.js and npm/pnpm installed
3. Database connection configured via `DATABASE_URL` environment variable

## Creating the Admin User

### Step 1: Run Database Migration

First, ensure the ADMIN role is added to your database:

```bash
cd attendance-iq-api
npx prisma migrate dev --name add_admin_role
```

Or if you're in production:

```bash
npx prisma migrate deploy
```

### Step 2: Create Admin User

Run the admin creation script:

```bash
npm run create-admin
```

Or with custom credentials:

```bash
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=YourSecurePassword123! ADMIN_NAME="Admin Name" npm run create-admin
```

### Default Credentials

If no environment variables are set, the script will use:
- **Email**: `admin@attendiq.com`
- **Password**: `Admin@123!`
- **Name**: `System Administrator`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## Environment Variables

You can customize the admin user creation by setting these environment variables:

- `ADMIN_EMAIL` - Email address for the admin user
- `ADMIN_PASSWORD` - Password for the admin user (must be at least 6 characters)
- `ADMIN_NAME` - Display name for the admin user

## Admin Dashboard Features

Once logged in as an admin, you can:

1. **View All Users**: See all registered users in the system
2. **Filter by Role**: Filter users by Students, Instructors, or Admins
3. **Search Users**: Search by name or email
4. **View Statistics**: See total counts of users by role

## Security Notes

- Admin users have full access to view all users in the system
- Admin endpoints are protected by the `AdminGuard`
- Only users with `ADMIN` role can access admin-only endpoints
- The `/users` endpoint is restricted to admin users only

## Troubleshooting

### Admin user already exists

If you see "Admin user already exists", the script will:
- Show the existing admin details
- Update the role to ADMIN if it's not already set

### Database connection errors

Ensure your `DATABASE_URL` is correctly set in your `.env` file or environment variables.

### Migration errors

If migrations fail, check:
1. Database is accessible
2. Prisma schema is up to date
3. No conflicting migrations exist
