# Vamoose! Backend

This is the Node.js (Express) backend for Vamoose!, a personalized trip planner that helps users manage trips, invite members, handle expenses, and more.

## 🛠 Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Supabase Auth (JWT-based)
- **Hosting**: Google Cloud Run
- **Testing**: Jest, Supertest
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
| `tests/`       | Contains integration tests and unit tests for controllers, models, and middleware, using Jest.                 |
| `cron/`        | Contains cron job to schedule notifications                                                                    |
| `db/`          | Contains connection for mongodb                                                                                |

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

### Running the Full Application with Docker

To run both the **frontend** and **server** together using Docker Compose:

```sh
docker-compose up --build
```

Stopping the Application

Press **CTRL + C** or run:

```sh
docker-compose down
```

## 🧪 Testing

The backend uses Jest for both unit testing and integration testing.

### 🛠 Running All Tests

To run all tests (unit and integration):

```bash
npm run test
```

### 🔍 Running Unit Tests

Unit tests run in isolation to validate individual functions and components. To run only the unit tests:

```bash
npm run test:unit
```

### 🔗 Running Integration Tests

Integration tests run against a PostgreSQL and Mongo test databases that are launched in Docker. To run integration tests:

1. **Ensure Docker is installed and running.**

2. Create a `.env.test` file in the `server/` directory with the following variables:

    ```env
    DIRECT_URL="postgresql://prisma:prisma@localhost:5433/tests"
    DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests"
    MONGO_TEST_URI="mongodb://mongo:mongo@localhost:27018/tests?authSource=admin&directConnection=true"
    SUPABASE_JWT_SECRET="Super-secret-key"
    ```

3. Run the integration tests:

    ```bash
    npm run test:integration
    ```


## 📏 Linting & Formatting

- **Linting**:

  ```bash
  npm run lint
  ```

- **Prettier Formatting**:

  ```bash
  npm run format
  ```

## 📡 API Endpoints

For a detailed breakdown of all API endpoints, refer to the [API Documentation](../Documentation/api_documentation.md).

Below is a summary of the key endpoints provided by the backend:

### Trips

| Endpoint             | Method | Description           |
| -------------------- | ------ | --------------------- |
| `/api/trips`         | POST   | Create a new trip     |
| `/api/trips/:tripId` | GET    | Fetch a single trip   |
| `/api/trips/`        | GET    | Fetch multiple trips  |
| `/api/trips/:tripId` | PATCH  | Update a trip         |
| `/api/trips/:tripId` | DELETE | Delete a trip         |
| `/api/trips/`        | DELETE | Delete multiple trips |

### Trip Invitations

| Endpoint                                     | Method | Description                              |
| -------------------------------------------- | ------ | ---------------------------------------- |
| `/api/trips/:tripId/invites/create`          | POST   | Send a trip invitation                   |
| `/api/trips/:tripId/invites/validate/:token` | GET    | Validate the invitation against the user |
| `/api/trips/:tripId/invites/accept/:token`   | POST   | Accept a trip invitation                 |
| `/api/trips/:tripId/invites/reject/:token`   | DELETE | Reject a trip invitation                 |
| `/api/trips/:tripId/invites/delete/:token`   | DELETE | Delete/retract a trip invitation         |

### Trip Members

| Endpoint                             | Method | Description                         |
| ------------------------------------ | ------ | ----------------------------------- |
| `/api/trips/:tripId/members/:userId` | GET    | Fetch single trip member            |
| `/api/trips/:tripId/members`         | GET    | Fetch multiple trip members         |
| `/api/trips/:tripId/members/:userId` | PATCH  | Update a single trip member         |
| `/api/trips/:tripId/members/leave`   | DELETE | Leave a trip                        |
| `/api/trips/:tripId/members/:userId` | DELETE | Kick a member out of a trip         |
| `/api/trips/:tripId/members/`        | DELETE | Kick multiple members out of a trip |

### Trip Expenses

| Endpoint                                 | Method | Description              |
| ---------------------------------------- | ------ | ------------------------ |
| `/api/trips/:tripId/expenses`            | POST   | Add an expense to a trip |
| `/api/trips/:tripId/expenses/:expenseId` | GET    | Fetch an expense         |
| `/api/trips/:tripId/expenses/:expenseId` | DELETE | Remove an expense        |
| `/api/trips/:tripId/expenses/`           | DELETE | Remove multiple expenses |

### Expense Shares

| Endpoint                                                | Method | Description                                                            |
| ------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `/api/trips/:tripId/expenseShares/debt-summary`         | GET    | Returns a summary of how much each member owes within a specific trip. |
| `/api/trips/:tripId/expenseShares/debt-summary/:userId` | GET    | Fetch detailed info about what a specific user owes to others.         |
| `/api/trips/:tripId/expenseShares/settle`               | PATCH  | Settle expenses for a trip.                                            |

### Itinerary Events

| Endpoint                                                | Method | Description                             |
| ------------------------------------------------------- | ------ | --------------------------------------- |
| `/api/trips/:tripId/itinerary-events/`                  | POST   | Create an itinerary event               |
| `/api/trips/:tripId/itinerary-events/:eventId`          | GET    | Fetch an itinerary event by ID          |
| `/api/trips/:tripId/itinerary-events/`                  | GET    | Fetch all itinerary events for a trip   |
| `/api/trips/:tripId/itinerary-events/:eventId`          | DELETE | Delete an itinerary event               |
| `/api/trips/:tripId/itinerary-events/`                  | DELETE | Batch delete itinerary events           |
| `/api/trips/:tripId/itinerary-events/:eventId`          | PATCH  | Update an itinerary event               |
| `/api/trips/:tripId/itinerary-events/:eventId/assign`   | POST   | Assign users to an itinerary event      |
| `/api/trips/:tripId/itinerary-events/:eventId/unassign` | DELETE | Unassign a user from an itinerary event |

#### Itinerary Event Notes

| Endpoint                                                     | Method | Description                        |
| ------------------------------------------------------------ | ------ | ---------------------------------- |
| `/api/trips/:tripId/itinerary-events/:eventId/notes/`        | POST   | Add a note to an itinerary event   |
| `/api/trips/:tripId/itinerary-events/:eventId/notes/:noteId` | PATCH  | Update an itinerary event note     |
| `/api/trips/:tripId/itinerary-events/:eventId/notes/:noteId` | DELETE | Delete an itinerary event note     |
| `/api/trips/:tripId/itinerary-events/:eventId/notes/`        | DELETE | Batch delete itinerary event notes |

### Trip Messages

| Endpoint                                                | Method | Description                          |
| ------------------------------------------------------- | ------ | ------------------------------------ |
| `/api/trips/:tripId/messages/sendMessage`               | POST   | Add a message to the chat cluster    |
| `/api/trips/:tripId/messages/`                          | GET    | Get all messages for a specific trip |
| `/api/trips/:tripId/messages/:messageId`                | PATCH  | Update a message or its reactions    |
| `/api/trips/:tripId/messages/:messageId/removeReaction` | PATCH  | Remove a reaction from a message     |

### Notifications

| Endpoint                                            | Method | Description                          |
| --------------------------------------------------- | ------ | ------------------------------------ |
| `/api/notifications/`                               | GET    | Get all notifications                |
| `/api/notifications/mark-as-read`                   | PATCH  | Batch mark notifications as read     |
| `/api/notifications/:notificationId/mark-as-read`   | PATCH  | Mark a single notification as read   |
| `/api/notifications/:notificationId/mark-as-unread` | PATCH  | Mark a single notification as unread |
| `/api/notifications/clear`                          | DELETE | Batch delete notifications           |
| `/api/notifications/:notificationId/clear`          | DELETE | Delete a single notification         |

### Polls

| Endpoint                                    | Method | Description                       |
| ------------------------------------------- | ------ | --------------------------------- |
| `/api/trips/:tripId/polls/`                 | GET    | Get all polls for a specific trip |
| `/api/trips/:tripId/polls/`                 | POST   | Create a poll                     |
| `/api/trips/:tripId/polls/:pollId/vote`     | POST   | Cast a vote on a poll             |
| `/api/trips/:tripId/polls/:pollId/complete` | PATCH  | Complete a poll                   |
| `/api/trips/:tripId/polls/:pollId`          | DELETE | Delete a poll                     |
| `/api/trips/:tripId/polls/:pollId/vote`     | DELETE | Delete a vote                     |
| `/api/trips/:tripId/polls/`                 | DELETE | Batch delete polls                |

### Marked Locations

| Endpoint                                                | Method | Description                           |
| ------------------------------------------------------- | ------ | ------------------------------------- |
| `/api/trips/:tripId/marked-locations`                   | GET    | Get all marked locations for a trip   |
| `/api/trips/:tripId/marked-locations`                   | POST   | Create a new marked location          |
| `/api/trips/:tripId/marked-locations/:locationId/notes` | PUT    | Update the notes of a marked location |
| `/api/trips/:tripId/marked-locations/:locationId`       | DELETE | Delete a marked location              |


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
- ✔️ Expense Shares (Debt summary, detailed user debts, settle shares)
- ✔️ Itinerary Events (Create, Fetch, Update, Delete, assign/unassign, notes)
- ✔️ Chat Messaging (Send, fetch, update messages and reactions)
- ✔️ Notifications (Fetch, mark read/unread, clear notifications)
- ✔️ Polls (Create polls, cast/delete votes, complete, batch delete)
- ✔️ Maps (Mark/Unmark loactions, update notes, fetch)
- ✔️ Unit Testing (Jest)
- ✔️ Integration Testing (Jest + Supertest)

## 💡 Contributors

👨‍💻 Anmol, Pritha, AK, Raman, Chuks

---