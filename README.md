# Afterink Invoice & Client Management Platform

A comprehensive web application for creative agencies and freelancers to handle invoice generation, client management, project tracking, and business operations with real-time analytics and reporting.

## 🚀 Features

### ✨ Recently Completed Features
- **Real-time Dashboard** - Live statistics with client, invoice, project, and revenue data
- **Complete Client Management** - Add, edit, and manage client information with contact details
- **Advanced Invoice System** - Create, track, and manage invoices with multiple status options
- **Project Management** - Comprehensive project tracking with client assignment and budget management
- **Business Analytics** - Detailed reports with revenue tracking, client statistics, and performance metrics
- **User Profile Management** - Complete user profile system with settings and preferences
- **Responsive Design** - Fully responsive interface optimized for all device sizes

### Core Modules
- **Authentication & User Management** - JWT-based authentication with role-based access control
- **Dashboard & Analytics** - Real-time business insights with interactive charts and statistics
- **Client Management System** - Complete client database with contact information and history
- **Invoice Management** - Professional invoice creation, tracking, and payment management
- **Project Management** - Task tracking, client assignment, and budget management
- **Financial Management** - Revenue tracking, expense management, and financial reporting
- **Reports & Analytics** - Comprehensive business analytics with export capabilities
- **Settings & Configuration** - User preferences, business settings, and notification management

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling and development
- Tailwind CSS for responsive styling
- React Router for client-side routing
- Zustand for state management
- Lucide React for icons
- Custom API utility for backend communication

**Backend:**
- Node.js with Express.js framework
- TypeScript for type safety
- MongoDB with Mongoose ODM
- JWT authentication with refresh tokens
- Express middleware for security and validation
- Rate limiting and CORS protection
- Comprehensive error handling

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (version 18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager
- Git for version control

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

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Company Information
COMPANY_NAME=Afterink Studio
COMPANY_ADDRESS=Your Company Address
COMPANY_PHONE=+1234567890
COMPANY_EMAIL=info@afterink.com
COMPANY_WEBSITE=https://afterink.com
```

#### Frontend Environment (.env in frontend folder)
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
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

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api
- Health Check: http://localhost:5000/health

### Production Build

#### Build Both Applications
```bash
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
│   │   │   └── database.ts    # MongoDB connection setup
│   │   ├── controllers/       # Route controllers
│   │   │   └── auth.ts        # Authentication controller
│   │   ├── middleware/        # Custom middleware
│   │   │   ├── auth.ts        # JWT authentication middleware
│   │   │   ├── errorHandler.ts # Global error handling
│   │   │   └── notFound.ts    # 404 handler
│   │   ├── models/           # Mongoose models
│   │   │   ├── User.ts       # User model
│   │   │   ├── Client.ts     # Client model
│   │   │   ├── Invoice.ts    # Invoice model
│   │   │   └── Project.ts    # Project model
│   │   ├── routes/           # API routes
│   │   │   ├── auth.ts       # Authentication routes
│   │   │   ├── users.ts      # User management routes
│   │   │   ├── clients.ts    # Client management routes
│   │   │   ├── invoices.ts   # Invoice management routes
│   │   │   └── projects.ts   # Project management routes
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   │   └── jwt.ts        # JWT utilities
│   │   └── server.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── auth/         # Authentication components
│   │   │   └── layouts/      # Layout components
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # Authentication pages
│   │   │   ├── ClientsPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── InvoicesPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── store/           # State management
│   │   │   └── authStore.ts # Authentication store
│   │   ├── api.ts           # API utility functions
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── package.json               # Root package.json
└── README.md                 # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/settings` - Update user settings
- `POST /api/users/change-password` - Change password

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get client by ID
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Run All Tests
```bash
npm test
```

## 📦 Deployment

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment

1. **Build the applications:**
```bash
npm run build
```

2. **Set production environment variables**

3. **Start the production server:**
```bash
npm start
```

### Environment Variables for Production

Ensure all environment variables are properly set for production:
- Use strong JWT secrets
- Configure proper CORS origins
- Set up production database connection
- Configure email services if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/afterink-invoice/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js community for the robust backend framework
- MongoDB team for the flexible database
- Tailwind CSS for the utility-first CSS framework
- All contributors who helped improve this project

---

**Built with ❤️ by the Afterink Team** 