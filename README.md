# Afterink Invoice & Client Management Platform

A comprehensive web application for creative agencies to handle invoice generation, client management, project tracking, and business operations.

## 🚀 Features

### Core Modules
- **Authentication & User Management** - Role-based access with JWT tokens
- **Dashboard & Analytics** - Revenue tracking and business insights  
- **Client Management System** - Complete client database with communication logs
- **Invoice Management** - Professional invoices with PDF generation and email integration
- **Project Management** - Task tracking, file management, and time tracking
- **Financial Management** - Expense tracking, payment records, and reporting
- **Reports & Analytics** - Comprehensive business analytics and export options

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- React Query for state management
- React Hook Form with Zod validation
- Framer Motion for animations
- Recharts for data visualization

**Backend:**
- Node.js with Express.js
- TypeScript throughout
- MongoDB with Mongoose ODM
- JWT authentication with refresh tokens
- Express Validator for input validation
- Multer for file uploads
- Nodemailer for email services

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (version 18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd afterink-invoice
```

### 2. Install Dependencies

#### Root Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Environment Configuration

#### Backend Environment (.env in backend folder)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/afterink-invoice

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE_TIME=1h
JWT_REFRESH_EXPIRE_TIME=7d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@afterink.com

# File Upload Configuration
UPLOAD_PATH=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Company Information
COMPANY_NAME=Afterink Studio
COMPANY_ADDRESS=Your Company Address
COMPANY_PHONE=+1234567890
COMPANY_EMAIL=info@afterink.com
COMPANY_WEBSITE=https://afterink.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Database Setup

Make sure MongoDB is running on your system. The application will automatically create the database and collections when you start the backend server.

For MongoDB Atlas (cloud):
1. Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Get your connection string
3. Replace `MONGODB_URI` in the .env file

## 🏃‍♂️ Running the Application

### Development Mode

#### Option 1: Run Both Frontend and Backend Together
```bash
# From the root directory
npm run dev
```

#### Option 2: Run Frontend and Backend Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Production Build

#### Build Both Applications
```bash
npm run build
```

#### Build Individually
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

#### Start Production Server
```bash
npm start
```

## 📁 Project Structure

```
afterink-invoice/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── config/            # Database and app configuration
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Custom middleware
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic services
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   └── server.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   ├── types/           # TypeScript interfaces
│   │   ├── utils/           # Helper functions
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── package.json               # Root package.json
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-avatar` - Upload profile picture
- `GET /api/users` - Get all users (admin only)

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get specific client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get specific invoice
- `PUT /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/send` - Send invoice via email
- `GET /api/invoices/:id/pdf` - Generate invoice PDF

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/tasks` - Add task to project
- `POST /api/projects/:id/files` - Upload project files

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting
- Helmet.js security headers
- File upload security

## 🎨 UI/UX Features

- Modern, responsive design
- Dark/light mode support (planned)
- Professional invoice templates
- Interactive charts and analytics
- Drag-and-drop file uploads
- Real-time notifications
- Progressive Web App capabilities (planned)

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Using Docker (Recommended)

1. Create Dockerfile for backend and frontend
2. Use docker-compose for multi-container setup
3. Deploy to your preferred cloud provider

### Manual Deployment

1. Build the applications
2. Set up production MongoDB
3. Configure environment variables
4. Deploy backend to Node.js hosting
5. Deploy frontend to static hosting (Vercel, Netlify)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: support@afterink.com
- Documentation: [docs.afterink.com](https://docs.afterink.com)
- Issues: [GitHub Issues](https://github.com/afterink/invoice-platform/issues)

## 🗺️ Roadmap

### Phase 1 (Current) - Foundation
- [x] Project setup and configuration
- [x] Authentication system
- [x] Basic CRUD operations
- [ ] Core UI components

### Phase 2 - Core Features
- [ ] Invoice generation and PDF export
- [ ] Client management
- [ ] Project tracking
- [ ] Email integration

### Phase 3 - Advanced Features
- [ ] Advanced reporting
- [ ] Payment integration
- [ ] Mobile responsiveness
- [ ] Performance optimization

### Phase 4 - Enterprise Features
- [ ] Multi-tenancy
- [ ] Advanced permissions
- [ ] API rate limiting
- [ ] Audit logging

---

Built with ❤️ by the Afterink Studio team 