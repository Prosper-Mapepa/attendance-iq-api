# SendGrid Email Setup - Using Your Gmail Address

## The Issue

SendGrid requires a **real, verifiable email address** that you can access. Since `noreply@attendiq.app` is a free Netlify domain and doesn't have an actual email inbox, you need to use an email address you own.

## Solution: Use Your Gmail Address

### Step 1: Verify Your Gmail in SendGrid

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Create New Sender"** (or edit the existing one)
3. Use your Gmail address: `mapepapro@gmail.com`
4. Fill in the form:
   - **From Email Address**: `mapepapro@gmail.com`
   - **From Name**: `AttendIQ`
   - **Reply To**: `mapepapro@gmail.com` (or leave as is)
   - **Company Address**: Your address
   - **Website**: Your website URL
5. Click **"Create"**
6. **Check your Gmail inbox** for the verification email
7. Click the verification link

### Step 2: Update Railway Environment Variables

Go to Railway → Your Service → Variables, and update:

```env
EMAIL_FROM=mapepapro@gmail.com
```

Keep the other variables:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key-here
APP_NAME=AttendIQ
```

### Step 3: Redeploy

Railway will automatically redeploy, or you can manually trigger it.

## How It Works

- **From Address**: Emails will appear to come from `mapepapro@gmail.com`
- **From Name**: Will show as "AttendIQ" (from APP_NAME)
- **Reply To**: Recipients can reply to your Gmail if needed
- **Display**: Recipients will see: `AttendIQ <mapepapro@gmail.com>`

## Alternative: Use a Custom Domain (Later)

If you want to use `noreply@attendiq.app` in the future:
1. You'll need to set up email hosting for `attendiq.app`
2. Or use SendGrid's Domain Authentication (requires DNS configuration)
3. For now, using your Gmail is the quickest solution

## Benefits of Using Gmail

- ✅ Already verified and accessible
- ✅ Works immediately
- ✅ No DNS configuration needed
- ✅ You can monitor replies if needed

## Testing

After updating:
1. Try password reset
2. Check SendGrid dashboard → **Activity** to see sends
3. Check your Gmail inbox for test emails

