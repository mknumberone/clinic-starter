import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with sample data...\n');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users
  console.log('👥 Creating users...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {},
    create: {
      email: 'admin@clinic.com',
      password_hash: defaultPassword,
      full_name: 'Admin User',
      phone: '0999999999',
      role: 'ADMIN',
    },
  });

  const doctorUsers = [];
  for (let i = 1; i <= 5; i++) {
    const doctor = await prisma.user.upsert({
      where: { email: `doctor${i}@clinic.com` },
      update: {},
      create: {
        email: `doctor${i}@clinic.com`,
        password_hash: defaultPassword,
        full_name: `Bác sĩ ${i === 1 ? 'Nguyễn Văn A' : i === 2 ? 'Trần Thị B' : i === 3 ? 'Lê Văn C' : i === 4 ? 'Phạm Thị D' : 'Hoàng Văn E'}`,
        phone: `088888888${i}`,
        role: 'DOCTOR',
      },
    });
    doctorUsers.push(doctor);
  }

  const patientUsers = [];
  for (let i = 1; i <= 10; i++) {
    const patient = await prisma.user.upsert({
      where: { email: `patient${i}@clinic.com` },
      update: {},
      create: {
        email: `patient${i}@clinic.com`,
        password_hash: defaultPassword,
        full_name: `Bệnh nhân ${String.fromCharCode(65 + i - 1)}`,
        phone: `077777777${i % 10}`,
        role: 'PATIENT',
      },
    });
    patientUsers.push(patient);
  }
  console.log(`✅ Created ${doctorUsers.length} doctors and ${patientUsers.length} patients\n`);

  // 2. Create Specializations
  console.log('🏥 Creating specializations...');
  const specializationNames = [
    'Nội khoa',
    'Ngoại khoa',
    'Nhi khoa',
    'Sản khoa',
    'Tim mạch',
  ];
  const specializations = [];
  for (const name of specializationNames) {
    const spec = await prisma.specialization.upsert({
      where: { name },
      update: {},
      create: { name, description: `Chuyên khoa ${name}` },
    });
    specializations.push(spec);
  }
  console.log(`✅ Created ${specializations.length} specializations\n`);

  // 3. Create Rooms
  console.log('🚪 Creating rooms...');
  const rooms = [];
  for (let i = 1; i <= 10; i++) {
    const roomCode = `P${i.toString().padStart(3, '0')}`;
    const room = await prisma.room.upsert({
      where: { code: roomCode },
      update: {},
      create: {
        name: `Phòng ${i.toString().padStart(3, '0')}`,
        code: roomCode,
        floor: `Tầng ${Math.floor((i - 1) / 3) + 1}`,
        specialization_id: specializations[i % specializations.length].id,
        capacity: 1,
      },
    });
    rooms.push(room);
  }
  console.log(`✅ Created ${rooms.length} rooms\n`);

  // 4. Create Patients (profiles)
  console.log('🏥 Creating patient profiles...');
  const patients = [];
  for (let i = 0; i < patientUsers.length; i++) {
    const patient = await prisma.patient.upsert({
      where: { user_id: patientUsers[i].id },
      update: {},
      create: {
        user_id: patientUsers[i].id,
        date_of_birth: new Date(1990 + (i % 30), i % 12, (i % 28) + 1),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        address: `${i + 1} Đường ABC, Quận ${(i % 12) + 1}, TP.HCM`,
      },
    });
    patients.push(patient);
  }
  console.log(`✅ Created ${patients.length} patient profiles\n`);

  // 5. Create Doctors (profiles)
  console.log('👨‍⚕️ Creating doctor profiles...');
  const doctors = [];
  for (let i = 0; i < doctorUsers.length; i++) {
    const doctor = await prisma.doctor.upsert({
      where: { user_id: doctorUsers[i].id },
      update: {},
      create: {
        user_id: doctorUsers[i].id,
        code: `BS${(i + 1).toString().padStart(4, '0')}`,
        title: i % 3 === 0 ? 'Tiến sĩ' : i % 2 === 0 ? 'Thạc sĩ' : 'Bác sĩ',
        biography: `Bác sĩ có ${5 + i} năm kinh nghiệm`,
      },
    });
    doctors.push(doctor);
  }
  console.log(`✅ Created ${doctors.length} doctor profiles\n`);

  // 6. Create Doctor Shifts
  console.log('📅 Creating doctor shifts...');
  let shiftCount = 0;
  for (const doctor of doctors) {
    // Create shifts for next 7 days
    for (let day = 0; day < 7; day++) {
      const shiftDate = new Date();
      shiftDate.setDate(shiftDate.getDate() + day);
      shiftDate.setHours(0, 0, 0, 0);

      // Morning shift
      await prisma.doctorShift.create({
        data: {
          doctor_id: doctor.id,
          room_id: rooms[shiftCount % rooms.length].id,
          start_time: new Date(shiftDate.getTime()).toISOString(),
          end_time: new Date(shiftDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        },
      });
      shiftCount++;

      // Afternoon shift
      if (day % 2 === 0) {
        await prisma.doctorShift.create({
          data: {
            doctor_id: doctor.id,
            room_id: rooms[(shiftCount + 1) % rooms.length].id,
            start_time: new Date(shiftDate.getTime() + 5 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(shiftDate.getTime() + 9 * 60 * 60 * 1000).toISOString(),
          },
        });
        shiftCount++;
      }
    }
  }
  console.log(`✅ Created ${shiftCount} shifts\n`);

  // 7. Create Medications
  console.log('💊 Creating medications...');
  const medications = [];
  const medNames = [
    { code: 'MED001', name: 'Paracetamol 500mg', form: 'Viên' },
    { code: 'MED002', name: 'Amoxicillin 500mg', form: 'Viên' },
    { code: 'MED003', name: 'Cetirizine 10mg', form: 'Viên' },
    { code: 'MED004', name: 'Omeprazole 20mg', form: 'Viên' },
    { code: 'MED005', name: 'Vitamin C 500mg', form: 'Viên' },
  ];
  for (const med of medNames) {
    const medication = await prisma.medication.upsert({
      where: { code: med.code },
      update: {},
      create: {
        code: med.code,
        name: med.name,
        form: med.form,
      },
    });
    medications.push(medication);
  }
  console.log(`✅ Created ${medications.length} medications\n`);

  // 8. Create Appointments
  console.log('📋 Creating appointments...');
  for (let i = 0; i < 15; i++) {
    const doctor = doctors[i % doctors.length];
    const patient = patients[i % patients.length];
    const room = rooms[i % rooms.length];
    
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() - (7 - (i % 7)));
    
    const startTime = new Date(appointmentDate);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(30);
    
    const appointment = await prisma.appointment.create({
      data: {
        patient_id: patient.id,
        doctor_assigned_id: doctor.id,
        room_id: room.id,
        start_time: startTime,
        end_time: endTime,
        status: i < 10 ? 'completed' : i < 13 ? 'confirmed' : 'scheduled',
        appointment_type: 'Khám tổng quát',
        notes: 'Khám định kỳ',
        created_by: adminUser.id,
      },
    });

    // Only create prescriptions and invoices for completed appointments
    if (i < 10) {
      // Create Prescription
      const prescription = await prisma.prescription.create({
        data: {
          patient_id: patient.id,
          doctor_id: doctor.id,
          appointment_id: appointment.id,
          notes: 'Uống thuốc theo chỉ định',
        },
      });

      // Add prescription items
      for (let j = 0; j < 2; j++) {
        await prisma.prescriptionItem.create({
          data: {
            prescription_id: prescription.id,
            medication_id: medications[j % medications.length].id,
            name: medications[j % medications.length].name,
            dosage: '1 viên',
            frequency: '3 lần/ngày',
            duration: '7 ngày',
            instructions: 'Uống sau ăn',
          },
        });
      }

      // Create Invoice
      const consultationFee = 200000;
      const medicationTotal = 50000;
      const totalAmount = consultationFee + medicationTotal;

      const invoice = await prisma.invoice.create({
        data: {
          patient_id: patient.id,
          appointment_id: appointment.id,
          total_amount: totalAmount,
          status: i % 3 === 0 ? 'PAID' : 'UNPAID',
        },
      });

      // Add invoice items
      await prisma.invoiceItem.create({
        data: {
          invoice_id: invoice.id,
          description: 'Phí khám bệnh',
          quantity: 1,
          amount: consultationFee,
        },
      });

      await prisma.invoiceItem.create({
        data: {
          invoice_id: invoice.id,
          description: 'Thuốc',
          quantity: 2,
          amount: medicationTotal / 2,
        },
      });

      // Create payment if paid
      if (i % 3 === 0) {
        await prisma.payment.create({
          data: {
            invoice_id: invoice.id,
            amount: totalAmount,
            method: i % 2 === 0 ? 'CASH' : 'CARD',
          },
        });
      }
    }
  }
  console.log('✅ Created 15 appointments with prescriptions and invoices\n');

  console.log('🎉 Seeding completed successfully!\n');
  console.log('📋 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ 1 Admin`);
  console.log(`✓ ${doctors.length} Doctors`);
  console.log(`✓ ${patients.length} Patients`);
  console.log(`✓ ${specializations.length} Specializations`);
  console.log(`✓ ${rooms.length} Rooms`);
  console.log(`✓ ${shiftCount} Doctor Shifts`);
  console.log(`✓ ${medications.length} Medications`);
  console.log(`✓ 15 Appointments (10 completed with invoices)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🔑 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 ADMIN:');
  console.log('   Phone: 0999999999');
  console.log('   OTP: 123456\n');
  console.log('👨‍⚕️ DOCTORS:');
  console.log('   Phone: 0888888881 - 0888888885');
  console.log('   OTP: 123456\n');
  console.log('👤 PATIENTS:');
  console.log('   Phone: 0777777770 - 0777777779');
  console.log('   OTP: 123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
