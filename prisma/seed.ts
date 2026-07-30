import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../src/config/database';

async function main() {
  console.log('🌱 Seeding database with users for all roles...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create ADMIN User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@messmate.com' },
    update: {},
    create: {
      email: 'admin@messmate.com',
      password: passwordHash,
      name: 'Super Admin',
      phone: '01700000001',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created: admin@messmate.com / password123');

  // 2. Create MANAGER User
  const manager = await prisma.user.upsert({
    where: { email: 'manager@messmate.com' },
    update: {},
    create: {
      email: 'manager@messmate.com',
      password: passwordHash,
      name: 'Mess Manager',
      phone: '01700000002',
      role: Role.MANAGER,
    },
  });
  console.log('✅ Manager user created: manager@messmate.com / password123');

  // 3. Create MEMBER User
  const member = await prisma.user.upsert({
    where: { email: 'member@messmate.com' },
    update: {},
    create: {
      email: 'member@messmate.com',
      password: passwordHash,
      name: 'Regular Member',
      phone: '01700000003',
      role: Role.MEMBER,
    },
  });
  console.log('✅ Member user created: member@messmate.com / password123');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
