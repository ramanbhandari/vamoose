# Vamoose! Backend

This is the Node.js (Express) backend for Vamoose!, a personalized trip planner that helps users manage trips, invite members, handle expenses, and more.

## 🛠 Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Supabase Auth (JWT-based)
- **Hosting**: Google Cloud Run
- **Testing**: Jest
- **Containerization**: Docker

## 📂 Project Structure

The backend is located in the `server/` folder of the repository. It follows a structured layout:

| Folder         | Description                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `config/`      | Contains Prisma Client configuration for database interaction.                                                 |
| `controllers/` | Handles business logic for trips, members, invitations, and expenses.                                          |
| `interfaces/`  | Defines TypeScript interfaces for better type safety.                                                          |
| `middleware/`  | Contains custom middleware, including `authMiddleware` (JWT authentication) and validators (input validation). |
| `models/`      | Contains Prisma-based models that interact with the PostgreSQL database.                                       |
| `routes/`      | Defines Express API routes, with `appRouter.ts` serving as the main `/api` entry point.                        |
| `utils/`       | Includes custom error handling utilities.                                                                      |
| `tests/`       | Contains unit tests for controllers, models, and middleware, using Jest.                                       |

## � Getting Started

### 📌 Prerequisites

- Node.js (version 20 or higher)
- npm
- Docker (for containerized deployment)

### 📥 Installation

1. Clone the repository and navigate to the backend folder:

   ```bash
   git clone https://github.com/your-repo/vamoose.git
   cd vamoose/server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## ⚙️ Running the Backend

### 🔧 Development Mode

To start the backend in development mode:

```bash
npm run dev
```

By default, the server runs on `http://localhost:8000`.

### 🚀 Production Mode

To build and start the production server:

```bash
npm run build
npm run start
```

## 🌍 Environment Variables

The backend uses Supabase authentication & PostgreSQL. Configure these in a `.env` file in the `server/` directory:

```env
# Database connection
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-database-url"

# Supabase JWT secret for authentication
SUPABASE_JWT_SECRET="your-secret-key"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

In `.env.local` (used for local dev):

```env
PUBLIC_SUPABASE_URL='https://your-supabase-url.supabase.co'
PUBLIC_SUPABASE_ANON_KEY='your-anon-key'
```

## 🐳 Docker Setup

### 📦 Build the Docker Image

```bash
docker build -t vamoose-backend .
```

### ▶️ Run the Docker Container

```bash
docker run -p 8000:8000 vamoose-backend
```

The backend will be accessible at `http://localhost:8000`.

## 🧪 Testing

The backend uses Jest for unit testing.

### 🛠 Running Tests

```bash
npm run test
```

### 📏 Linting & Formatting

- **Linting**:

  ```bash
  npm run lint
  ```

- **Prettier Formatting**:

  ```bash
  npm run format
  ```

## 📡 API Endpoints

API documentation is not available yet, but here are some key endpoints:

| Endpoint                                     | Method | Description                               |
| -------------------------------------------- | ------ | ----------------------------------------- |
| `/api/trips`                                 | POST   | Create a new trip                         |
| `/api/trips/:tripId`                         | GET    | Fetch a single trip                       |
| `/api/trips/`                                | GET    | Fetch multiple trips                      |
| `/api/trips/:tripId`                         | PATCH  | Update a trip                             |
| `/api/trips/:tripId`                         | DELETE | Delete a trip                             |
| `/api/trips/`                                | DELETE | Delete multiple trips                     |
| `/api/trips/:tripId/invites/create`          | POST   | Send a trip invitation                    |
| `/api/trips/:tripId/invites/validate/:token` | GET    | Validates the invitation against the user |
| `/api/trips/:tripId/invites/accept/:token`   | POST   | Accepts a trip invitation                 |
| `/api/trips/:tripId/invites/reject/:token`   | DELETE | Rejects a trip invitation                 |
| `/api/trips/:tripId/invites/delete/:token`   | DELETE | Deletes/retracts a trip invitation        |
| `/api/trips/:tripId/members/:userId`         | GET    | Fetch single trip member                  |
| `/api/trips/:tripId/members`                 | GET    | Fetch multiple trip members               |
| `/api/trips/:tripId/members/:userId`         | PATCH  | Update single trip member                 |
| `/api/trips/:tripId/members/leave`           | DELETE | Leave a trip                              |
| `/api/trips/:tripId/members/:userId`         | DELETE | Kick a member out of a trip               |
| `/api/trips/:tripId/members/`                | DELETE | Kick multiple members out of a trip       |
| `/api/trips/:tripId/expenses`                | POST   | Add an expense to a trip                  |
| `/api/trips/:tripId/expenses/:expenseId`     | GET    | Fetch an expense                          |
| `/api/trips/:tripId/expenses/:expenseId`     | DELETE | Remove an expense                         |
| `/api/trips/:tripId/expenses/`               | DELETE | Remove multiple expenses                  |

🔹 More API routes will be added as development progresses.

## ☁️ Deployment

### 🚀 Where is the backend hosted?

The backend is deployed on Google Cloud Services.

### 🔄 How is it deployed?

- The backend is connected to Google Cloud Run.
- It automatically deploys whenever new code is pushed to the `main` branch.

## ✅ Completed Features

- ✔️ Trip Management (Create, Fetch, Update, Delete trips)
- ✔️ Trip Membership (Invitations, Accept/Reject, Leave trip, Remove members)
- ✔️ Expense Management (Add, Fetch, Delete expenses)
- ✔️ Unit Testing (Jest)

## 💡 Contributors

👨‍💻 Anmol, Pritha, AK, Raman, Chuks

---
