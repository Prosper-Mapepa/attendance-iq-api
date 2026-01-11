# SendGrid Quick Setup Checklist

## ✅ Quick Steps (5 minutes)

### 1. Create SendGrid Account
- [ ] Go to https://sendgrid.com and sign up (free)
- [ ] Verify your email address

### 2. Verify Sender
- [ ] Go to **Settings** → **Sender Authentication**
- [ ] Click **"Create New Sender"** (or edit existing)
- [ ] Use your **real Gmail address**: `mapepapro@gmail.com`
- [ ] Fill in the form:
  - From Email: `mapepapro@gmail.com`
  - From Name: `AttendIQ`
  - Reply To: `mapepapro@gmail.com`
- [ ] **Check your Gmail** and click verification link

### 3. Create API Key
- [ ] Go to **Settings** → **API Keys**
- [ ] Click **"Create API Key"**
- [ ] Choose **"Full Access"** (or Restricted with Mail Send)
- [ ] Name it: `AttendIQ Production`
- [ ] **COPY THE API KEY** (starts with `SG.`)

### 4. Update Railway Variables
Go to Railway → Your Service → Variables tab, and set:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.paste-your-key-here
EMAIL_FROM=mapepapro@gmail.com
APP_NAME=AttendIQ
```

### 5. Test
- [ ] Railway will auto-redeploy
- [ ] Try password reset or email change
- [ ] Check SendGrid dashboard → **Activity** to see sends
- [ ] Check your email inbox

## 🎉 Done!

Your emails should now send reliably without timeout errors.

## Need Help?

- See `SENDGRID_SETUP.md` for detailed instructions
- Check SendGrid dashboard for delivery status
- Check Railway logs if issues persist

