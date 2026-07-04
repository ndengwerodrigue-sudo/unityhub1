# The Unity Hub - Cameroon Community Platform

A comprehensive full-stack web application designed to connect students, entrepreneurs, businesses, NGOs, and job seekers across Cameroon. Built with modern web technologies to foster community growth, opportunity sharing, and professional networking.

## 🌟 Features

### Core Features
- **User Authentication System** - Secure registration, login, and profile management
- **Community Feed** - Share posts, engage with community members
- **Opportunities Board** - Discover jobs, internships, and scholarships
- **Business Directory** - Promote and discover local businesses
- **Events Section** - Create and join community events
- **Admin Role** - Content moderation and user management

### Technical Features
- JWT-based authentication with bcrypt password hashing
- Role-based access control
- Input validation and sanitization
- Responsive design with Tailwind CSS
- Real-time updates with React Query
- Modern UI/UX with Lucide icons

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast development server and build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
Real_Unity_Hub/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Server entry point
│   ├── package.json     # Dependencies
│   └── .env.example     # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── App.jsx      # Main app component
│   │   ├── main.jsx     # App entry point
│   │   └── index.css    # Global styles
│   ├── public/          # Static assets
│   ├── package.json     # Dependencies
│   └── vite.config.js   # Vite configuration
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Real_Unity_Hub
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

3. **Configure Environment Variables**
   Edit the `.env` file in the backend directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/unity_hub

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_EXPIRE=7d

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

3. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

## 📚 API Documentation

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Posts Routes
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post (authenticated)
- `PUT /api/posts/:id` - Update post (author/admin)
- `DELETE /api/posts/:id` - Delete post (author/admin)
- `POST /api/posts/:id/like` - Like/unlike post (authenticated)
- `POST /api/posts/:id/comments` - Add comment (authenticated)

### Opportunities Routes
- `GET /api/opportunities` - Get all opportunities
- `POST /api/opportunities` - Create opportunity (authenticated)
- `PUT /api/opportunities/:id` - Update opportunity (creator/admin)
- `DELETE /api/opportunities/:id` - Delete opportunity (creator/admin)

### Businesses Routes
- `GET /api/businesses` - Get all businesses
- `POST /api/businesses` - Add business (authenticated)
- `PUT /api/businesses/:id` - Update business (owner/admin)
- `DELETE /api/businesses/:id` - Delete business (owner/admin)
- `PUT /api/businesses/:id/verify` - Verify business (admin)

### Events Routes
- `GET /api/events` - Get upcoming events
- `POST /api/events` - Create event (authenticated)
- `PUT /api/events/:id` - Update event (creator/admin)
- `DELETE /api/events/:id` - Delete event (creator/admin)
- `POST /api/events/:id/attend` - Attend/unattend event (authenticated)

### Users Routes
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `DELETE /api/users/:id` - Deactivate user (admin)
- `PUT /api/users/:id/role` - Update user role (admin)

## 🔐 Security Features

- **Password Hashing** - All passwords are hashed using bcrypt
- **JWT Authentication** - Secure token-based authentication
- **Input Validation** - Server-side validation for all inputs
- **Rate Limiting** - Protection against brute force attacks
- **CORS Configuration** - Proper cross-origin resource sharing setup
- **Helmet.js** - Security headers for Express.js
- **Role-Based Access Control** - Different permissions for different user roles

## 🎨 UI/UX Features

- **Responsive Design** - Works on all device sizes
- **Modern UI** - Clean, professional interface with Tailwind CSS
- **Interactive Components** - Smooth transitions and hover effects
- **Accessibility** - Semantic HTML and ARIA labels
- **Error Handling** - User-friendly error messages
- **Loading States** - Proper loading indicators
- **Toast Notifications** - Non-intrusive feedback system

## 🚀 Deployment

### Backend Deployment (Heroku Example)
1. Create a new Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git:
   ```bash
   cd backend
   heroku create
   git push heroku main
   ```

### Frontend Deployment (Vercel Example)
1. Install Vercel CLI
2. Deploy from frontend directory:
   ```bash
   cd frontend
   vercel --prod
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please email us at [support@unityhub.cm](mailto:support@unityhub.cm) or create an issue in the repository.

## 🙏 Acknowledgments

- The Unity Hub team and all contributors
- The Cameroonian tech community
- Open source libraries and frameworks that made this project possible

---

**Built with ❤️ for the Cameroonian community**
