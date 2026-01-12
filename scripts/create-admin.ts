import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function createAdmin() {
  // Default admin credentials - CHANGE THESE IN PRODUCTION!
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@attendiq.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123!';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`❌ Admin user with email ${adminEmail} already exists!`);
      console.log(`   User ID: ${existingAdmin.id}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // Update to ADMIN role if not already
      if (existingAdmin.role !== UserRole.ADMIN) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: UserRole.ADMIN },
        });
        console.log(`✅ Updated user role to ADMIN`);
      }
      
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Generate QR code
    const qrCode = uuidv4();

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        qrCode,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        qrCode: true,
        createdAt: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   User ID: ${admin.id}`);
    console.log(`   QR Code: ${admin.qrCode}`);
    console.log(`   Created: ${admin.createdAt}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
