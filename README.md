# 🏥 Clinic Appointment Booking App

A full-stack appointment booking application for small clinics, built with React, Node.js, and MongoDB. Features role-based access control, real-time slot management, and a responsive UI.

## 🚀 Live Demo

- **Frontend URL**: [Deploy to Vercel/Netlify]
- **API URL**: [Deploy to Render/Railway]
- **Test Credentials**:
  - **Patient**: `patient@example.com` / `Passw0rd!`
  - **Admin**: `admin@example.com` / `Passw0rd!`

## 🛠️ Tech Stack & Trade-offs

### Frontend
- **React 18 + Vite**: Modern React with fast build tooling. Trade-off: Vite provides excellent dev experience but requires Node.js 14+.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development. Trade-off: Larger bundle size but faster development and consistent design system.
- **React Router**: Client-side routing for SPA experience. Trade-off: Better UX but requires proper server configuration for production.

### Backend
- **Node.js + Express**: JavaScript runtime with minimal framework. Trade-off: Single language (JS) across stack but callback-based async patterns.
- **MongoDB + Mongoose**: NoSQL database with ODM. Trade-off: Flexible schema but eventual consistency and no built-in transactions.
- **JWT Authentication**: Stateless auth tokens. Trade-off: Better scalability but tokens can't be invalidated before expiry.

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Git

### One-Command Setup
```bash
# Clone and install dependencies
git clone <your-repo-url>
cd Assignment-Wundrsight
npm install

# Start both frontend and backend
npm start
```

### Manual Setup
```bash
# Backend (Port 5001)
cd backend
npm install
npm start

# Frontend (Port 3000) - New Terminal
cd frontend  
npm install
npm run dev
```

## ⚙️ Environment Variables

### Backend (.env)
```bash
PORT=5001
MONGODB_URI=mongodb://localhost:27017/appointment-booking
JWT_SECRET=your-64-character-secret-key
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:5001
```

## 🚀 Deployment Steps

### Frontend (Vercel)
```bash
# Build the project
cd frontend
npm run build

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

### Backend (Render)
```bash
# Connect GitHub repo to Render
# Set build command: npm install
# Set start command: npm start
# Set environment variables in Render dashboard
```

### Database (MongoDB Atlas)
1. Create free cluster
2. Get connection string
3. Update `MONGODB_URI` in backend environment

## 📁 Architecture Notes

### Folder Structure Rationale
```
├── backend/                 # API server
│   ├── controllers/        # Business logic
│   ├── models/            # Data schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & validation
│   └── utils/             # Helper functions
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── contexts/      # State management
│   │   └── services/      # API calls
└── shared/                 # Common utilities
```

**Rationale**: Separation of concerns with clear boundaries. Backend follows MVC pattern, frontend uses component-based architecture with context for state management.

### Authentication & RBAC Approach
- **JWT-based**: Stateless tokens with user role embedded
- **Role-based Access Control**: Two roles (patient/admin) with different permissions
- **Middleware Protection**: Route-level authentication and authorization
- **Session Persistence**: Tokens stored in localStorage with automatic refresh

**Security Features**: Password hashing (bcrypt), rate limiting, CORS protection, input validation

### Concurrency & Atomicity for Booking
- **Unique Constraints**: Database-level uniqueness on `slotId` in bookings
- **Pre-save Hooks**: Mongoose middleware prevents double-booking
- **Transaction-like Operations**: Slot status updated atomically with booking creation
- **Race Condition Prevention**: MongoDB's unique indexes handle concurrent requests

**Trade-offs**: No true ACID transactions (MongoDB limitation) but sufficient for this use case

### Error Handling Strategy
- **Structured Error Responses**: Consistent JSON error format with codes
- **Input Validation**: Express-validator for request sanitization
- **Graceful Degradation**: Frontend shows user-friendly error messages
- **Logging**: Backend logs errors for debugging
- **Rate Limiting**: Prevents abuse and DoS attacks

## 🧪 Quick Verification Script

### 1. Register a New Patient
```bash
curl -X POST "http://localhost:5001/api/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "password": "SecurePass123!"
  }'
```

### 2. Login as Patient
```bash
curl -X POST "http://localhost:5001/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Get Available Slots
```bash
curl -X GET "http://localhost:5001/api/slots?from=2025-08-21&to=2025-08-21" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Book a Slot
```bash
curl -X POST "http://localhost:5001/api/book" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"slotId": "SLOT_ID_FROM_STEP_3"}'
```

### 5. Get My Bookings
```bash
curl -X GET "http://localhost:5001/api/my-bookings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Admin: View All Bookings
```bash
curl -X GET "http://localhost:5001/api/all-bookings" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## 🧪 Basic Tests

### Backend Tests
```bash
cd backend
npm test
```

**Test Coverage**:
- Authentication (register, login, JWT validation)
- Slot management (CRUD operations)
- Booking operations (create, cancel, validation)
- Role-based access control
- Input validation and error handling

### Frontend Tests
```bash
cd frontend
npm test
```

**Test Coverage**:
- Component rendering
- User interactions
- Form validation
- API integration
- Route protection

## 📋 Known Limitations & Future Improvements

### Current Limitations
- **No Real-time Updates**: Slots don't update in real-time across multiple users
- **Basic Search**: No advanced filtering or search capabilities
- **No Notifications**: No email/SMS reminders for appointments
- **Limited Timezone Support**: Assumes server local time

### With 2 More Hours
1. **Real-time Updates**: Implement WebSocket connections for live slot updates
2. **Advanced Search**: Add date range picker and slot filtering
3. **Email Notifications**: Integrate SendGrid for appointment confirmations
4. **Timezone Support**: Add moment.js for proper timezone handling
5. **Mobile Optimization**: Improve responsive design for mobile devices

## ✅ Submission Checklist

- [ ] **Frontend URL**: [Deploy to Vercel/Netlify]
- [ ] **API URL**: [Deploy to Render/Railway]  
- [ ] **Patient**: `patient@example.com` / `Passw0rd!`
- [ ] **Admin**: `admin@example.com` / `Passw0rd!`
- [ ] **Repo URL**: [Your GitHub Repository]
- [ ] **Run locally**: README steps verified ✅
- [ ] **Postman/curl steps included** ✅

## 🐛 Troubleshooting

### Common Issues
1. **Port Already in Use**: Kill existing processes with `pkill -f "node"`
2. **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
3. **JWT Secret**: Generate new secret with `openssl rand -hex 32`
4. **CORS Issues**: Check frontend URL in backend CORS configuration

### Debug Mode
```bash
# Backend with detailed logging
cd backend
DEBUG=* npm start

# Frontend with React DevTools
cd frontend
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/profile` - Get user profile

### Slot Endpoints
- `GET /api/slots` - Get available slots
- `GET /api/slots/all` - Get all slots (admin only)
- `POST /api/slots/generate` - Generate slots (admin only)
- `POST /api/slots` - Add single slot (admin only)
- `DELETE /api/slots/:id` - Remove slot (admin only)

### Booking Endpoints
- `POST /api/book` - Book a slot
- `GET /api/my-bookings` - Get user bookings
- `GET /api/all-bookings` - Get all bookings (admin only)
- `PATCH /api/bookings/:id/cancel` - Cancel booking

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first approach
- MongoDB team for the flexible database
- Express.js community for the robust backend framework
