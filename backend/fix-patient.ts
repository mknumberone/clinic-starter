import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUser() {
  const userId = '800bb6ea-9eed-44e5-a320-bad87df25e95';
  
  console.log('Checking patient record...');
  
  const existingPatient = await prisma.patient.findFirst({
    where: { user_id: userId }
  });
  
  if (existingPatient) {
    console.log('✅ Patient record already exists:', existingPatient.id);
  } else {
    console.log('❌ No patient record found. Creating...');
    
    const newPatient = await prisma.patient.create({
      data: {
        user_id: userId,
        gender: 'MALE',
        date_of_birth: new Date('1990-01-01'),
        address: 'Hà Nội',
      }
    });
    
    console.log('✅ Patient record created:', newPatient.id);
  }
}

fixUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
