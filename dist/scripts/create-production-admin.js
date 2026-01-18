"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
async function createProductionAdmin() {
    const adminEmail = 'mapepaprosper76@gmail.com';
    const adminPassword = 'BreAkThr0ugHinGOD@0140x!@!';
    const adminName = 'System Administrator';
    try {
        console.log('🚀 Creating production admin user...');
        console.log(`   Email: ${adminEmail}`);
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail },
        });
        if (existingAdmin) {
            console.log(`\n⚠️  User with email ${adminEmail} already exists!`);
            console.log(`   User ID: ${existingAdmin.id}`);
            console.log(`   Current Role: ${existingAdmin.role}`);
            if (existingAdmin.role !== client_1.UserRole.ADMIN) {
                await prisma.user.update({
                    where: { id: existingAdmin.id },
                    data: { role: client_1.UserRole.ADMIN },
                });
                console.log(`✅ Updated user role to ADMIN`);
                console.log(`\n🔐 Login Credentials:`);
                console.log(`   Email: ${adminEmail}`);
                console.log(`   Password: ${adminPassword}`);
            }
            else {
                console.log(`✅ User is already an ADMIN`);
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
        console.log('\n✅ Production admin user created successfully!');
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
        console.log('\n✨ You can now log in to the admin dashboard!');
    }
    catch (error) {
        console.error('\n❌ Error creating admin user:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
createProductionAdmin()
    .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=create-production-admin.js.map