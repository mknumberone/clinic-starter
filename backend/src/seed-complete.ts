// @ts-nocheck
import { PrismaClient, UserRole, Gender, AppointmentStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with sample data...\n');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create Branches (Fix lỗi unique key ở đây)
  console.log('🏢 Creating branches...');
  const branches = [];

  // Tạo từng cái một để đảm bảo lấy được object trả về
  const branch1 = await prisma.branch.upsert({
    where: { name: 'Cơ sở Cầu Giấy' }, // Schema đã thêm @unique nên cái này hoạt động
    update: {},
    create: {
      name: 'Cơ sở Cầu Giấy',
      address: '123 Đường Cầu Giấy, Hà Nội',
      phone: '0241234567',
    },
  });
  branches.push(branch1);

  const branch2 = await prisma.branch.upsert({
    where: { name: 'Cơ sở Hai Bà Trưng' },
    update: {},
    create: {
      name: 'Cơ sở Hai Bà Trưng',
      address: '456 Bà Triệu, Hà Nội',
      phone: '0247654321',
    },
  });
  branches.push(branch2);

  console.log(`✅ Created ${branches.length} branches\n`);

  // 2. Create Users
  console.log('👥 Creating users...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: { role: UserRole.ADMIN }, // Dùng Enum
    create: {
      email: 'admin@clinic.com',
      password_hash: defaultPassword,
      full_name: 'Admin User',
      phone: '0999999999',
      role: UserRole.ADMIN,
    },
  });

  const doctorUsers = [];
  for (let i = 1; i <= 5; i++) {
    const doctor = await prisma.user.upsert({
      where: { email: `doctor${i}@clinic.com` },
      update: { role: UserRole.DOCTOR },
      create: {
        email: `doctor${i}@clinic.com`,
        password_hash: defaultPassword,
        full_name: `Bác sĩ ${i === 1 ? 'Nguyễn Văn A' : i === 2 ? 'Trần Thị B' : 'Hoàng Văn E'}`,
        phone: `088888888${i}`,
        role: UserRole.DOCTOR, // Enum
        // Gán bác sĩ vào chi nhánh (chia đều)
        branch_id: branches[i % branches.length].id,
      },
    });
    doctorUsers.push(doctor);
  }

  const patientUsers = [];
  for (let i = 1; i <= 10; i++) {
    const patient = await prisma.user.upsert({
      where: { email: `patient${i}@clinic.com` },
      update: { role: UserRole.PATIENT },
      create: {
        email: `patient${i}@clinic.com`,
        password_hash: defaultPassword,
        full_name: `Bệnh nhân ${String.fromCharCode(65 + i - 1)}`,
        phone: `077777777${i % 10}`,
        role: UserRole.PATIENT, // Enum
      },
    });
    patientUsers.push(patient);
  }
  console.log(`✅ Created ${doctorUsers.length} doctors and ${patientUsers.length} patients\n`);

  console.log('👥 Creating Branch Managers & Receptionists...');

  // 1. Tạo Quản lý cho Chi nhánh 1 (Giả sử branches[0] là Cầu Giấy)
  const targetBranch = branches[0];
  await prisma.user.upsert({
    where: { email: 'manager1@clinic.com' },
    update: {},
    create: {
      email: 'manager1@clinic.com',
      password_hash: defaultPassword,
      full_name: 'Quản lý Phạm Văn C',
      phone: '0911111111',
      role: UserRole.BRANCH_MANAGER, // Role Mới
      branch_id: branch1.id, // BẮT BUỘC GẮN CHI NHÁNH
    },
  });

  // 2. Tạo Lễ tân cho Chi nhánh 1
  await prisma.user.upsert({
    where: { email: 'reception1@clinic.com' },
    update: {},
    create: {
      email: 'reception1@clinic.com',
      password_hash: defaultPassword,
      full_name: 'Lễ tân Lê Thị D',
      phone: '0922222222',
      role: UserRole.RECEPTIONIST, // Role Mới
      branch_id: branch1.id, // BẮT BUỘC GẮN CHI NHÁNH
    },
  });

  console.log('✅ Created Manager (0911111111) & Receptionist (0922222222)');

  // 3. Create Specializations
  console.log('🏥 Creating specializations...');
  const specializationNames = ['Nội khoa', 'Ngoại khoa', 'Nhi khoa', 'Sản khoa', 'Tim mạch'];
  const specializations = [];
  for (const name of specializationNames) {
    const spec = await prisma.specialization.upsert({
      where: { name },
      update: {},
      create: { name, description: `Chuyên khoa ${name}` },
    });
    specializations.push(spec);
  }

  // 4. Create Rooms
  console.log('🚪 Creating rooms...');
  const rooms = [];
  for (let i = 1; i <= 10; i++) {
    const roomCode = `P${i.toString().padStart(3, '0')}`;
    const branch = branches[i % branches.length];
    const room = await prisma.room.upsert({
      where: { code: roomCode },
      update: { branch_id: branch.id },
      create: {
        name: `Phòng ${i.toString().padStart(3, '0')}`,
        code: roomCode,
        floor: `Tầng ${Math.floor((i - 1) / 3) + 1}`,
        specialization_id: specializations[i % specializations.length].id,
        branch_id: branch.id, // Bắt buộc
        capacity: 1,
      },
      include: {
        branch: true,
      },
    });
    rooms.push(room);
  }

  // 5. Create Patient Profiles
  const patients = [];
  for (let i = 0; i < patientUsers.length; i++) {
    const patient = await prisma.patient.upsert({
      where: { user_id: patientUsers[i].id },
      update: {},
      create: {
        user_id: patientUsers[i].id,
        date_of_birth: new Date(1990 + (i % 30), i % 12, (i % 28) + 1),
        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE, // Enum
        address: `${i + 1} Đường ABC, Quận ${(i % 12) + 1}, TP.HCM`,
      },
    });
    patients.push(patient);
  }

  // 6. Create Doctor Profiles
  const doctors = [];
  for (let i = 0; i < doctorUsers.length; i++) {
    const doctor = await prisma.doctor.upsert({
      where: { user_id: doctorUsers[i].id },
      update: {},
      create: {
        user_id: doctorUsers[i].id,
        code: `BS${(i + 1).toString().padStart(4, '0')}`,
        title: 'Bác sĩ',
        biography: `Kinh nghiệm ${5 + i} năm`,
      },
    });
    doctors.push(doctor);
  }

  // 7. Create Doctor Shifts
  // ... (Logic tạo shift giữ nguyên, chỉ cần đảm bảo room đã có branch_id như trên)

  // 8. Create Medications
  const medications = [];
  const medNames = [
    { code: 'MED001', name: 'Paracetamol 500mg' },
    { code: 'MED002', name: 'Amoxicillin 500mg' },
  ];
  for (const med of medNames) {
    const medication = await prisma.medication.upsert({
      where: { code: med.code },
      update: {},
      create: {
        code: med.code,
        name: med.name,
        form: 'Viên',
      },
    });
    medications.push(medication);
  }

  // 9. Create Appointments
  console.log('📋 Creating appointments...');
  for (let i = 0; i < 15; i++) {
    const doctor = doctors[i % doctors.length];
    const patient = patients[i % patients.length];
    const room = rooms[i % rooms.length];
    // Lấy branch từ room
    const branchId = room.branch_id;

    const startTime = new Date();
    startTime.setDate(startTime.getDate() + (i - 5)); // rải rác ngày
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(30);

    // Logic trạng thái dùng Enum
    const status = i < 5 ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED;

    const appointment = await prisma.appointment.create({
      data: {
        patient_id: patient.id,
        doctor_assigned_id: doctor.id,
        room_id: room.id,
        branch_id: branchId, // Gắn chi nhánh
        start_time: startTime,
        end_time: endTime,
        status: status, // Enum
        appointment_type: 'Khám tổng quát',
        created_by: adminUser.id,
      },
    });

    if (status === AppointmentStatus.COMPLETED) {
      // Create Invoice
      const totalAmount = 250000;
      const invoice = await prisma.invoice.create({
        data: {
          branch_id: branchId,
          patient_id: patient.id,
          appointment_id: appointment.id,
          total_amount: totalAmount, // Decimal (nhập số OK)
          status: InvoiceStatus.PAID, // Enum
        },
      });

      // Create Payment
      await prisma.payment.create({
        data: {
          invoice_id: invoice.id,
          amount: totalAmount, // Decimal
          method: PaymentMethod.CASH, // Enum
        },
      });
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });