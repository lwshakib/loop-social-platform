# Loop Social Platform - Server

A robust Node.js/Express backend server for the Loop social media platform, built with TypeScript, MongoDB, and modern web technologies.

## 🚀 Features

- **Authentication & Authorization**

  - JWT-based authentication (Access & Refresh tokens)
  - User registration and login
  - Email OTP verification
  - Token refresh mechanism
  - Protected routes with middleware

- **Social Media Features**

  - Posts (create, read, like, comment, save)
  - Stories (create and manage)
  - User profiles with follow/unfollow
  - Comments with nested replies
  - Notifications system
  - Image upload via Cloudinary

- **Technical Features**
  - TypeScript for type safety
  - MongoDB with Mongoose ODM
  - Request validation with Zod
  - Comprehensive error handling
  - Logging with Winston and Morgan
  - Email service with Nodemailer
  - CORS configuration
  - Cookie-based authentication

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Cloudinary account (for image uploads)
- Email service credentials (Gmail or MailHog for development)

## 🛠️ Installation

1. **Clone the repository** (if not already done)

   ```bash
   git clone <repository-url>
   cd loop-social-platform/server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the `server` directory with the following variables:

   ```env
   # Node Environment
   NODE_ENV=development
   PORT=3000
   NODE_VERSION=18.0.0

   # Database
   MONGODB_URI=mongodb://localhost:27017

   # JWT Secrets
   ACCESS_TOKEN_SECRET=your_access_token_secret_here
   REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Email Configuration
   MAILHOG_SMTP_HOST=localhost
   MAILHOG_SMTP_PORT=1025
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_PASS=your_app_password
   EMAIL_FROM=Loop <noreply@loop.com>
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## 🏃 Running the Server

### Development Mode

```bash
npm run dev
```

This will watch for TypeScript changes and automatically restart the server.

### Production Mode

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

API endpoints will be available at: `http://localhost:3000/api`

## 📁 Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── cloudinary.config.ts
│   │   └── envs.ts
│   ├── controllers/      # Route controllers
│   │   ├── auth.controllers.ts
│   │   ├── cloudinary.controllers.ts
│   │   ├── health.controllers.ts
│   │   ├── notification.controllers.ts
│   │   ├── post.controllers.ts
│   │   ├── story.controllers.ts
│   │   └── user.controllers.ts
│   ├── db/               # Database connection
│   │   └── index.ts
│   ├── logger/           # Logging utilities
│   │   ├── morgan.logger.ts
│   │   └── winston.logger.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── models/           # Mongoose models
│   │   ├── comment.model.ts
│   │   ├── follow.model.ts
│   │   ├── like.model.ts
│   │   ├── notification.model.ts
│   │   ├── otp.model.ts
│   │   ├── post.model.ts
│   │   ├── saved.model.ts
│   │   ├── story.model.ts
│   │   └── user.model.ts
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   ├── cloudinary.routes.ts
│   │   ├── health.routes.ts
│   │   ├── index.ts
│   │   ├── notification.routes.ts
│   │   ├── post.routes.ts
│   │   ├── story.routes.ts
│   │   └── user.routes.ts
│   ├── utils/            # Utility functions
│   │   ├── ApiError.ts
│   │   ├── ApiResponse.ts
│   │   ├── asyncHandler.ts
│   │   └── mail.ts
│   ├── validators/       # Zod validation schemas
│   │   ├── auth.validators.ts
│   │   ├── post.validators.ts
│   │   ├── story.validators.ts
│   │   └── user.validators.ts
│   ├── app.ts            # Express app configuration
│   ├── constants.ts      # Application constants
│   └── index.ts          # Server entry point
├── dist/                 # Compiled JavaScript (generated)
├── logs/                 # Log files (generated)
├── api/                  # Vercel serverless functions
├── package.json
├── tsconfig.json
└── vercel.json           # Vercel deployment configuration
```

## 🔌 API Endpoints

### Health Check

- `GET /api/health` - Server health check

### Authentication

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/send-otp-email` - Send OTP email
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/validate-token` - Validate access token

### Users

- `GET /api/users` - Get user profiles
- `GET /api/users/:userId` - Get specific user profile
- `PUT /api/users/:userId` - Update user profile
- `POST /api/users/:userId/follow` - Follow a user
- `DELETE /api/users/:userId/follow` - Unfollow a user

### Posts

- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `POST /api/posts/:postId/like` - Like a post
- `DELETE /api/posts/:postId/like` - Unlike a post
- `POST /api/posts/:postId/saved` - Save a post
- `DELETE /api/posts/:postId/saved` - Unsave a post
- `GET /api/posts/:postId/comments` - Get post comments
- `POST /api/posts/:postId/comments` - Create a comment
- `GET /api/posts/:postId/comments/:commentId/replies` - Get comment replies

### Stories

- `GET /api/stories` - Get all stories
- `POST /api/stories` - Create a story
- `GET /api/stories/:storyId` - Get specific story
- `DELETE /api/stories/:storyId` - Delete a story

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark notification as read

### Cloudinary

- `POST /api/cloudinary/upload` - Upload image to Cloudinary

> **Note:** Most endpoints require authentication. Include the JWT token in the Authorization header or as a cookie.

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived (15 minutes), used for API requests
2. **Refresh Token**: Long-lived (7 days), used to refresh access tokens

Tokens are sent via:

- HTTP-only cookies (recommended)
- Authorization header: `Bearer <token>`

## 🗄️ Database

The application uses MongoDB with the following collections:

- `users` - User accounts and profiles
- `posts` - Social media posts
- `comments` - Post comments
- `likes` - Post likes
- `saves` - Saved posts
- `stories` - User stories
- `follows` - User follow relationships
- `notifications` - User notifications
- `otps` - Email verification OTPs

Database name: `loop-social-platform`

## 📝 Logging

The application uses two logging systems:

1. **Winston**: Application-level logging (info, error, etc.)

   - Logs are stored in the `logs/` directory
   - Separate files for different log levels

2. **Morgan**: HTTP request logging middleware
   - Logs all incoming HTTP requests

## 🚀 Deployment

### Vercel Deployment

The project is configured for Vercel serverless deployment:

1. **Build Configuration**: See `vercel.json`
2. **Serverless Functions**: Located in `api/` directory
3. **Environment Variables**: Set in Vercel dashboard

### Environment Variables for Production

Ensure all environment variables from the `.env` file are set in your deployment platform.

## 🧪 Development

### TypeScript Compilation

The project uses TypeScript with strict type checking:

- Source files: `src/`
- Compiled output: `dist/`
- Watch mode: `npm run dev`

### Code Style

- TypeScript strict mode enabled
- ES modules
- CommonJS output format

## 📦 Dependencies

### Core Dependencies

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cloudinary` - Image upload service
- `nodemailer` - Email service
- `zod` - Schema validation
- `winston` - Logging
- `morgan` - HTTP request logging
- `cors` - CORS middleware
- `cookie-parser` - Cookie parsing
- `dotenv` - Environment variables

### Development Dependencies

- `typescript` - TypeScript compiler
- `tsc-watch` - TypeScript watch mode
- `@types/*` - TypeScript type definitions

## 🔧 Configuration

### CORS

Currently configured for `http://localhost:5173` (Vite default). Update in `src/app.ts` for production.

### Email Service

- Development: MailHog (localhost:1025)
- Production: Gmail SMTP

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 👤 Author

**Shakib Khan** - [@lwshakib](https://github.com/lwshakib)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Note**: Make sure to keep your `.env` file secure and never commit it to version control. The `.gitignore` file is configured to exclude environment files.
