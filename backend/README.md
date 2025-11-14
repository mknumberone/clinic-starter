# Backend (NestJS + TypeScript)

## Prerequisites

- Node.js (v20+)
- Docker and Docker Compose
- PostgreSQL client (optional, for local connection testing)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and update credentials:

```bash
Copy-Item .env.example .env
```

The `.env` file should contain:

```
DATABASE_URL=postgresql://clinic:clinic@localhost:5432/clinic
MONGO_URI=mongodb://localhost:27017/clinic
REDIS_URL=redis://localhost:6379
```

### 3. Start Database Services

Start PostgreSQL, MongoDB, and Redis using Docker Compose:

```bash
# From the project root directory
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- MongoDB on port 27017
- Redis on port 6379

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Push Database Schema

Create all database tables by pushing the Prisma schema:

```bash
npx prisma db push
```

### 6. Build the Project

```bash
npm run build
```

### 7. Run the Application

**Development mode (with auto-reload):**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm start
```

The backend will be available at `http://localhost:3000/api`

## Database Connection

### Using Navicat (or any PostgreSQL client)

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `clinic`
- **Username**: `clinic`
- **Password**: `clinic`
- **Schema**: `public`

### Database Tables

The following tables will be created:
- User
- Patient
- Doctor
- Specialization
- Room
- DoctorShift
- Appointment
- AppointmentStatusLog
- Prescription
- PrescriptionItem
- Medication
- Invoice
- InvoiceItem
- Payment
- File

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name
```

## Project Structure

```
backend/
├── src/
│   ├── app.module.ts       # Main application module
│   └── main.ts             # Application entry point
├── prisma-migrations/
│   ├── schema.prisma       # Prisma database schema
│   └── migrations/         # Database migrations
├── dist/                   # Compiled output
├── package.json
├── tsconfig.json           # TypeScript configuration
└── nest-cli.json           # NestJS CLI configuration
```

## Notes

- Use Prisma for PostgreSQL models (recommended)
- Use Mongoose for EHR (MongoDB)
- Implement microservices structure: auth, appointment, ehr, notification...

## Troubleshooting

### "Cannot find module 'dist/main.js'"
Run `npm run build` first to compile TypeScript to JavaScript.

### "Could not find Prisma Schema"
The schema path is configured in `package.json` under `prisma.schema` to point to `prisma-migrations/schema.prisma`.

### "Connection refused" or "Password authentication failed"
Ensure Docker containers are running with `docker-compose up -d`. If you changed credentials, restart with:
```bash
docker-compose down -v
docker-compose up -d
npx prisma db push
```
