#!/bin/bash

# Railway deployment script
echo "🚀 Starting AttendIQ Backend..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🎯 Starting NestJS application..."
npm run start:prod
