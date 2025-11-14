import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Enable CORS
  app.enableCors();
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Clinic Management API')
    .setDescription('API documentation for Clinic Management System')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('patients', 'Patient management endpoints')
    .addTag('doctors', 'Doctor management endpoints')
    .addTag('specializations', 'Specialization management endpoints')
    .addTag('rooms', 'Room management endpoints')
    .addTag('doctor-shifts', 'Doctor shift management endpoints')
    .addTag('appointments', 'Appointment booking and management endpoints')
    .addTag('prescriptions', 'Prescription management endpoints')
    .addTag('medications', 'Medication catalog endpoints')
    .addTag('invoices', 'Invoice management endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('dashboard', 'Dashboard and statistics endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Clinic API Docs',
    customfavIcon: 'https://nestjs.com/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });
  
  await app.listen(3000);
  console.log('🚀 Backend listening on http://localhost:3000/api');
  console.log('📚 Swagger docs available at http://localhost:3000/api/docs');
}
bootstrap();
