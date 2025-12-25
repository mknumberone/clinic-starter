import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = '800bb6ea-9eed-44e5-a320-bad87df25e95';
  
  console.log('=== Checking User ===');
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  console.log('User:', user);
  
  console.log('\n=== Checking Patient ===');
  const patient = await prisma.patient.findFirst({
    where: { user_id: userId },
    include: { user: true }
  });
  console.log('Patient:', patient);
  
  if (user && !patient) {
    console.log('\n❌ User exists but NO Patient record found!');
    console.log('Creating patient record...');
    
    const newPatient = await prisma.patient.create({
      data: {
        user_id: userId,
      },
      include: { user: true }
    });
    
    console.log('✅ Patient created:', newPatient);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
