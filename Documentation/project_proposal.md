# Vamoose! - A Group Trip & Expense Planner

# Vision

Vamoose! is a group trip planning app that helps friends and families organize their travel, share expenses, and manage trip details in one place. The goal is to make trip planning simple, collaborative, and hassle-free so that everyone can enjoy their travels without worrying about logistics.

# Summary

Vamoose! is a web app that allows users to plan group trips, track expenses, and coordinate travel activities. Users can create trip itineraries, share costs, chat with group members, and vote on plans. The app ensures that everyone stays updated and in sync with the trip details.

This platform is ideal for:

- **Friends and family** planning vacations together
- **Students and backpackers** managing shared expenses
- **Corporate teams** coordinating business trips
- **Event organizers** handling group logistics

# Tech Stack

#### Frontend: React.js + Next.js

#### Backend: Node.js + Express.js

#### Database: PostgreSQL, Supabase, Prisma + MongoDB (to store chat).

#### Authentication: Supabase Auth (Google login, email/password).

#### Real-Time Features: WebSockets (Socket.io) (for chat, live expenses).

#### Maps & Location: Google Maps API / Leaflet.js (for pinning places).

#### Payments (Optional): Stripe API (for expense tracking, trip payments).

# Core Features

## 1. User Authentication & Account Management (Non-Functional)

Users must have secure and easy access to the platform through account creation, login, and profile management. This ensures only authorized users can access and modify trip-related data.

### Key Functionalities:

- User registration with email and password
- Secure login with authentication
- Password reset functionality
- Profile management (edit name, bio, and profile picture)
- Logout functionality

## 2. Trip Planning Dashboard

Users can create and manage trips with details such as destination, dates, and budget. This dashboard serves as a central hub where all trip-related information is stored and accessible to all trip members.

### Key Functionalities:

- Create, edit, and delete trips
- Invite members to join a trip
- View upcoming and past trips
- Set and manage trip budgets

## 3. Group Expense Tracking & Cost Splitting

Users can log trip expenses, assign payments to specific members, and track balances to ensure fair cost-sharing among the group.

### Key Functionalities:

- Add and categorize expenses (food, travel, accommodation)
- Assign payments to members and auto-calculate shares
- Track who owes whom and settle balances
- Edit and delete expenses
- Request and confirm payments

## 4. Real-Time Chat & Voting System

A built-in chat system allows group members to communicate, discuss trip details, and vote on important decisions.

### Key Functionalities:

- Real-time messaging within the trip group
- Create and participate in polls for trip decisions
- Receive notifications for new messages and votes
- React to messages with emojis

## 5. Interactive Map & Location Sharing

Users can pin important locations related to their trip, such as hotels, restaurants, and attractions. Optional live location sharing helps with group coordination.

### Key Functionalities:

- Pin and categorize locations on an interactive map
- View a shared map of trip-related places
- Share real-time location with group members
- Search for nearby places and get directions

## 6. Itinerary Builder with Notifications

Users can plan and organize a detailed itinerary for their trip, ensuring that all members are aware of scheduled activities.

### Key Functionalities:

- Create a day-by-day itinerary with events
- Assign activities to trip members
- Set automatic reminders for upcoming events
- View itinerary in a calendar format

## 7. Packing List & Task Assignments

A shared packing list ensures that group members bring necessary items and avoid duplicates. Users can also assign trip-related tasks.

### Key Functionalities:

- Create a packing checklist shared among all trip members
- Assign specific packing items to individuals
- Track packed and unpacked items
- Create and assign to-do tasks (e.g., booking flights, reservations)
- Set deadlines and receive reminders for pending tasks

# User Stories for Core Features

## 1. User Authentication & Account Management

- As a new user, I should be able to register by creating an account so that I can access the platform.
- As a registered user, I should be able to log in with my credentials so that I can access my trips.
- As a user, I should be able to reset my password so that I can regain access to my account if I forget my credentials.
- As a user, I should be able to log out so that my account remains secure.
- As a user, I should be able to update my profile information so that I can personalize my account.

## 2. Trip Planning Dashboard

- As a user, I should be able to create a trip with details so that I can plan my travel with friends.
- As a user, I should be able to invite others to join my trip so that we can collaborate on planning.
- As a user, I should be able to edit trip details (name, dates, location) so that I can update any changes.
- As a user, I should be able to delete a trip if plans get canceled so that I can remove it from my dashboard.
- As a user, I should be able to see a summary of all my upcoming and past trips so that I can keep track of my travel history.
- As a user, I should be able to set a budget for my trip so that I can manage expenses effectively.

## 3. Group Expense Tracking & Cost Splitting

- As a user, I should be able to add expenses to the trip so that I can track shared costs.
- As a user, I should be able to assign who paid for an expense so that the system can calculate how much each person owes.
- As a user, I should be able to see a breakdown of trip expenses so that I know who owes whom.
- As a user, I should be able to edit or delete an expense so that I can fix any mistakes.
- As a user, I should be able to mark an expense as "settled" so that I can keep track of completed payments.
- As a user, I should be able to request payments from group members so that expenses are fairly split.
- As a user, I should be able to filter expenses by category (food, travel, accommodation) so that I can see how much was spent in each area.

## 4. Real-Time Chat & Voting System

- As a user, I should be able to send messages in the group chat so that I can discuss trip details with my friends.
- As a user, I should be able to create a poll so that I can let my group vote on trip decisions.
- As a user, I should be able to vote on a poll so that I can contribute to trip planning.
- As a user, I should be able to see live updates on the chat so that I can stay informed about discussions.
- As a user, I should be able to receive notifications when a new message or poll is posted so that I don’t miss important updates.
- As a user, I should be able to react to messages (e.g., like, thumbs up) so that I can quickly express agreement.

## 5. Interactive Map & Location Sharing

- As a user, I should be able to pin locations (hotels, attractions, restaurants) so that my group knows key places in our trip.
- As a user, I should be able to see all pinned locations on a shared map so that I can navigate easily.
- As a user, I should be able to share my live location with the group so that they can track my position.
- As a user, I should be able to disable location sharing so that I can control my privacy.
- As a user, I should be able to search for nearby places (hotels, restaurants, landmarks) so that I can add relevant locations to the trip.
- As a user, I should be able to get directions to any pinned location so that I can find my way easily.

## 6. Itinerary Builder with Notifications

- As a user, I should be able to create an itinerary with events and times so that I can plan daily activities.
- As a user, I should be able to assign activities to specific trip members so that responsibilities are clear.
- As a user, I should be able to edit or delete events from the itinerary so that I can update plans.
- As a user, I should be able to receive reminders before an event starts so that I don’t forget planned activities.
- As a user, I should be able to view my itinerary in a calendar format so that I can see my schedule at a glance.
- As a user, I should be able to add notes or descriptions to itinerary events so that I can provide more details about each activity.

## 7. Packing List & Task Assignments

- As a user, I should be able to create a shared packing list so that everyone knows what to bring.
- As a user, I should be able to add and remove items from the packing list so that I can update it as needed.
- As a user, I should be able to assign specific items to group members so that we don’t bring duplicate items.
- As a user, I should be able to mark items as “packed” so that I know they are ready.
- As a user, I should be able to create a to-do list (e.g., "book flights") so that I can track important trip tasks.
- As a user, I should be able to assign tasks to trip members so that everyone knows their responsibilities.
- As a user, I should be able to set deadlines for tasks so that they are completed on time.
- As a user, I should be able to get reminders for unfinished tasks so that I don’t forget important things.
