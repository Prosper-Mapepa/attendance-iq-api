"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
async function createAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@attendiq.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';
    try {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail },
        });
        if (existingAdmin) {
            console.log(`❌ Admin user with email ${adminEmail} already exists!`);
            console.log(`   User ID: ${existingAdmin.id}`);
            console.log(`   Role: ${existingAdmin.role}`);
            if (existingAdmin.role !== client_1.UserRole.ADMIN) {
                await prisma.user.update({
                    where: { id: existingAdmin.id },
                    data: { role: client_1.UserRole.ADMIN },
                });
                console.log(`✅ Updated user role to ADMIN`);
            }
            return;
        }
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const qrCode = (0, uuid_1.v4)();
        const admin = await prisma.user.create({
            data: {
                name: adminName,
                email: adminEmail,
                passwordHash,
                role: client_1.UserRole.ADMIN,
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
    }
    catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
createAdmin()
    .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=create-admin.js.map