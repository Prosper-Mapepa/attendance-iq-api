# Railway Production Admin Setup

This guide explains how to create the production admin user on Railway.

## Prerequisites

1. ✅ Database migration for ADMIN role must be deployed
2. ✅ Railway project is set up and running
3. ✅ Database connection is configured

## Step 1: Deploy the Migration

First, ensure the ADMIN role migration is deployed. The migration file is located at:
```
prisma/migrations/20250101000000_add_admin_role/migration.sql
```

If you haven't deployed it yet, Railway should automatically run migrations on deploy if you have `prisma migrate deploy` in your start script.

## Step 2: Create Admin User on Railway

### Option A: Using Railway CLI (Recommended)

1. Connect to your Railway service:
```bash
railway run bash
```

2. Once in the Railway environment, run:
```bash
npm run create-production-admin
```

### Option B: Using Railway Dashboard

1. Go to your Railway project dashboard
2. Navigate to your API service
3. Click on "Deployments" or "Settings"
4. Add a custom command in the "Deploy Command" or use the "Run Command" feature:
   ```bash
   npm run create-production-admin
   ```

### Option C: One-time Deploy Script

You can also add this to your deployment process temporarily. In your `package.json`, you could add:

```json
"scripts": {
  "postdeploy": "npm run create-production-admin || true"
}
```

The `|| true` ensures deployment doesn't fail if admin already exists.

## Admin Credentials

The production admin user will be created with:

- **Email**: `mapepaprosper76@gmail.com`
- **Password**: `BreAkThr0ugHinGOD@0140x!@!`
- **Role**: `ADMIN`

## Verification

After running the script, you should see output like:

```
✅ Production admin user created successfully!

📋 Admin Details:
   Name: System Administrator
   Email: mapepaprosper76@gmail.com
   Role: ADMIN
   ...
```

## Login

1. Go to your production frontend URL
2. Click "Sign In"
3. Enter:
   - Email: `mapepaprosper76@gmail.com`
   - Password: `BreAkThr0ugHinGOD@0140x!@!`
4. You should be redirected to the Admin Dashboard

## Troubleshooting

### "Admin user already exists"

This is fine! The script will update the existing user to ADMIN role if needed.

### Database connection errors

Ensure your `DATABASE_URL` environment variable is set correctly in Railway.

### Migration not applied

Run migrations manually:
```bash
railway run npx prisma migrate deploy
```

### Script not found

Make sure you've committed and deployed the `scripts/create-production-admin.ts` file to Railway.

## Security Notes

⚠️ **IMPORTANT**: 
- Keep these credentials secure
- Consider changing the password after first login
- Never commit production credentials to version control
- The production admin script is safe to run multiple times (idempotent)
