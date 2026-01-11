# SendGrid Email Setup Guide

## Why SendGrid?

SendGrid is recommended for production because:
- ✅ More reliable than Gmail SMTP on cloud platforms like Railway
- ✅ Better deliverability rates
- ✅ Free tier: 100 emails/day (perfect for starting out)
- ✅ No connection timeout issues
- ✅ Better analytics and monitoring

## Step-by-Step Setup

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Click **"Start for free"** or **"Sign Up"**
3. Fill in your details:
   - Email address
   - Password
   - Company name (optional)
4. Verify your email address

### Step 2: Verify Sender Identity

1. After logging in, go to **Settings** → **Sender Authentication**
2. Choose **"Verify a Single Sender"** (easiest for testing)
3. Fill in the form:
   - **From Email Address**: `noreply@attendiq.app` (or your preferred email)
   - **From Name**: `AttendIQ`
   - **Reply To**: (same as from email)
   - **Company Address**: Your address
   - **Website**: Your website URL
4. Click **"Create"**
5. **Check your email** and click the verification link

**Note**: For production, you may want to verify your entire domain instead of a single sender.

### Step 3: Create API Key

1. Go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Choose **"Full Access"** (or "Restricted Access" with Mail Send permissions)
4. Give it a name: `AttendIQ Production`
5. Click **"Create & View"**
6. **IMPORTANT**: Copy the API key immediately - you won't be able to see it again!
   - It will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Configure Railway Environment Variables

1. Go to your Railway dashboard
2. Select your `attendance-iq-api` service
3. Go to **Variables** tab
4. Add/Update these variables:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-actual-api-key-here
EMAIL_FROM=noreply@attendiq.app
APP_NAME=AttendIQ
```

5. **Remove or keep** the SMTP variables (they won't be used):
   - `SMTP_HOST` (optional - can keep)
   - `SMTP_PORT` (optional - can keep)
   - `SMTP_USER` (optional - can keep)
   - `SMTP_PASS` (optional - can keep)

### Step 5: Redeploy

Railway will automatically redeploy when you save the environment variables. Or you can manually trigger a redeploy.

### Step 6: Test

1. Try to reset a password or change an email
2. Check SendGrid dashboard → **Activity** to see if emails are being sent
3. Check your email inbox

## Troubleshooting

### Emails Not Sending

1. **Check SendGrid Activity Feed**:
   - Go to SendGrid dashboard → **Activity**
   - Look for failed sends and error messages

2. **Verify API Key**:
   - Make sure the API key is correct (starts with `SG.`)
   - Ensure it has "Mail Send" permissions

3. **Check Sender Verification**:
   - Make sure your sender email is verified
   - Check the verification status in SendGrid dashboard

4. **Check Railway Logs**:
   - Look for email service errors
   - Verify `EMAIL_PROVIDER=sendgrid` is set

### Common Errors

- **"Unauthorized"**: API key is incorrect or doesn't have permissions
- **"Sender not verified"**: Need to verify the sender email in SendGrid
- **"Rate limit exceeded"**: You've exceeded the free tier limit (100 emails/day)

## SendGrid Dashboard Features

- **Activity Feed**: See all email sends, bounces, opens, clicks
- **Statistics**: Track email performance
- **Suppressions**: Manage unsubscribes and bounces
- **API Keys**: Manage your API keys

## Free Tier Limits

- **100 emails/day** (resets daily)
- **40,000 emails for first 30 days** (new accounts)
- Perfect for testing and small deployments

## Upgrade When Needed

When you exceed the free tier:
- **Essentials Plan**: $19.95/month for 50,000 emails
- **Pro Plan**: $89.95/month for 100,000 emails
- See https://sendgrid.com/pricing for details

## Security Best Practices

1. **Never commit API keys to git**
2. **Use environment variables only**
3. **Rotate API keys periodically**
4. **Use restricted access API keys** when possible (only Mail Send permission)
5. **Monitor activity** for suspicious sends

## Next Steps

After setup:
1. Test password reset functionality
2. Test email change verification
3. Monitor SendGrid dashboard for delivery rates
4. Set up email templates (optional - currently using HTML templates)

