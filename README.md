# Biometric Attendance Management System

A production-ready biometric attendance management system for tertiary institutions using fingerprint authentication.

## Features

✅ **Fingerprint Authentication** - Secure biometric attendance tracking
✅ **Role-Based Access** - Separate interfaces for students and lecturers
✅ **Real-Time Sessions** - Start/stop attendance sessions with live tracking
✅ **Encrypted Storage** - Biometric templates encrypted with AES-256-GCM
✅ **JWT Authentication** - Secure token-based authentication
✅ **Responsive UI** - Modern, mobile-friendly interface with Tailwind CSS
✅ **RESTful API** - Complete Swagger documentation
✅ **100% Free Stack** - Vercel + Render + Aiven free tiers

## Technology Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, TanStack Query
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Security**: JWT, Helmet, bcrypt, AES-256-GCM encryption
- **Deployment**: Vercel (frontend), Render (backend), Aiven (database)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npm run dev
```

Backend runs at `http://localhost:4000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with backend URL
npm run dev
```

Frontend runs at `http://localhost:3000`

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── routes/                # API endpoints
│   │   ├── middleware/            # Auth middleware
│   │   ├── utils/                 # Crypto & biometric utils
│   │   └── swagger.ts             # API documentation
│   └── index.ts                   # Express server
├── frontend/
│   ├── app/
│   │   ├── login/                 # Login page
│   │   ├── register/              # Registration page
│   │   ├── dashboard/             # Student dashboard
│   │   └── lecturer/dashboard/    # Lecturer dashboard
│   ├── components/ui/             # Reusable UI components
│   └── lib/
│       ├── api/                   # API client functions
│       └── biometric-scanner.ts   # Fingerprint SDK simulation
└── README.md
```

## User Roles

### Student
- Register/login with matric number
- Register fingerprint template
- View enrolled courses
- View attendance history

### Lecturer
- Register/login with staff ID
- Create courses
- Start/stop attendance sessions
- Scan student fingerprints
- View attendance reports

## API Documentation

Swagger documentation available at: `http://localhost:4000/api/docs`

### Key Endpoints

**Authentication**
- `POST /api/auth/students/register`
- `POST /api/auth/students/login`
- `POST /api/auth/lecturers/register`
- `POST /api/auth/lecturers/login`

**Student (Protected)**
- `GET /api/students/me`
- `GET /api/students/courses`
- `GET /api/students/attendance`
- `POST /api/students/biometric`

**Lecturer (Protected)**
- `POST /api/lecturers/courses`
- `POST /api/lecturers/courses/:id/sessions/start`
- `POST /api/lecturers/sessions/:id/stop`
- `POST /api/lecturers/sessions/:id/scan`
- `GET /api/lecturers/courses/:id/attendance`

## Security

- **No raw fingerprints stored** - Only encrypted templates
- **AES-256-GCM encryption** for biometric data
- **JWT tokens** with 1-day expiration
- **bcrypt password hashing** (10 rounds)
- **Helmet.js** for HTTP security headers
- **CORS** configured
- **Role-based access control**

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Database**: Create PostgreSQL on Aiven (free)
2. **Backend**: Deploy to Render (free)
3. **Frontend**: Deploy to Vercel (free)

## Biometric Integration

The system includes a simulated fingerprint scanner for development. For production:

1. Replace `frontend/lib/biometric-scanner.ts` with actual SDK
2. Update `backend/src/utils/biometric.ts` with SDK matching logic
3. Recommended SDKs:
   - DigitalPersona U.are.U
   - Neurotechnology MegaMatcher
   - SecuGen SDK

## Development

### Database Migrations

```bash
cd backend
npx prisma migrate dev --name migration_name
npx prisma generate
```

### Reset Database

```bash
npx prisma migrate reset
```

## License

MIT

## Support

For issues or questions:
- Check API docs at `/api/docs`
- Review [DEPLOYMENT.md](./DEPLOYMENT.md)
- Check backend/frontend logs
