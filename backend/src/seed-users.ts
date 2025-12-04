import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // Tạo admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {
      role: 'ADMIN',
      phone: '0999999999',
    },
    create: {
      email: 'admin@clinic.com',
      password_hash: defaultPassword,
      full_name: 'Admin User',
      phone: '0999999999',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin);

  // Tạo doctor user
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@clinic.com' },
    update: {
      role: 'DOCTOR',
      phone: '0888888888',
    },
    create: {
      email: 'doctor@clinic.com',
      password_hash: defaultPassword,
      full_name: 'Bác sĩ Nguyễn Văn A',
      phone: '0888888888',
      role: 'DOCTOR',
    },
  });
  console.log('✅ Doctor user created:', doctor);

  // Tạo patient user
  const patient = await prisma.user.upsert({
    where: { email: 'patient@clinic.com' },
    update: {
      role: 'PATIENT',
      phone: '0777777777',
    },
    create: {
      email: 'patient@clinic.com',
      password_hash: defaultPassword,
      full_name: 'Bệnh nhân Trần Thị B',
      phone: '0777777777',
      role: 'PATIENT',
    },
  });
  console.log('✅ Patient user created:', patient);

  console.log('\n📋 Test credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 ADMIN:');
  console.log('   Phone: 0999999999');
  console.log('   OTP:   123456');
  console.log('');
  console.log('👨‍⚕️ DOCTOR:');
  console.log('   Phone: 0888888888');
  console.log('   OTP:   123456');
  console.log('');
  console.log('👤 PATIENT:');
  console.log('   Phone: 0777777777');
  console.log('   OTP:   123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
