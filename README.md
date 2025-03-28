# Vamoose! - Comp 4350

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ramanbhandari_vamoose&metric=alert_status)](https://sonarcloud.io/dashboard?id=ramanbhandari_vamoose)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ramanbhandari_vamoose&metric=coverage)](https://sonarcloud.io/dashboard?id=ramanbhandari_vamoose)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=ramanbhandari_vamoose&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=ramanbhandari_vamoose)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=ramanbhandari_vamoose&metric=security_rating)](https://sonarcloud.io/dashboard?id=ramanbhandari_vamoose)

## Table of Contents

- [Vamoose! - Comp 4350](#vamoose---comp-4350)
  - [Table of Contents](#table-of-contents)
  - [Description](#description)
  - [Documents](#documents)
  - [Installation](#installation)
  - [Docker Images](#docker-images)
  - [Load Tests](#load-tests)
    - [**Report Contents:**](#report-contents)
    - [**📊 Access the Latest Report**](#-access-the-latest-report)
  - [Architecture](#architecture)
  - [Contributing](#contributing)
  - [Team](#team)
  - [Meeting Times](#meeting-times)

## Description

**Vamoose!** is an intuitive group trip planning app designed to help friends, families, and teams organize their travel plans with ease. Whether you're planning a vacation, a business trip, or a group event, Vamoose! consolidates all your trip details in one convenient platform. The app allows users to plan and share itineraries, track and split expenses, collaborate on packing lists, and communicate in real-time.

Key features include:

- **Trip Planning Dashboard**
- **Expense Tracking & Cost Splitting**
- **Real-Time Chat & Voting**
- **Interactive Map & Location Sharing**
- **Itinerary Builder**
- **Packing List & Task Assignments**

Vamoose! aims to make group trip planning seamless and fun, removing the stress of coordination and allowing users to focus on enjoying their time together.

## Documents

- [Proposal Document](./Documentation/project_proposal.md)
- [Test Plan Document](./Documentation/Test_Plan_Sprint_3.pdf)
- [Acceptance Tests](./Documentation/Acceptance_Tests.pdf)
- Sequence Diagrams
  - [Expense_API](./Documentation/SequenceDiagrams/expense_api_seq_diagram.pdf)
  - [Expense_Shares_API](./Documentation/SequenceDiagrams/expenseShare_api_seq_diagram.pdf)
  - [Invite_API](./Documentation/SequenceDiagrams/invitee_api_seq_diagram.pdf)
  - [Member_API](./Documentation/SequenceDiagrams/member_api_seq_diagram.pdf)
  - [Trip_API](./Documentation/SequenceDiagrams/trip_api_seq_diagram.pdf)
  - [Polls_API](./Documentation/SequenceDiagrams/polls_api_seq_diagram.pdf)
  - [Notifications_API](./Documentation/SequenceDiagrams/notifications_api_seq_diagram.pdf)
  - [Events_API](./Documentation/SequenceDiagrams/events_api_seq_diagram.pdf)
  - [Events_Notes_API](./Documentation/SequenceDiagrams/eventNotes_api_seq_diagram.pdf)
  - [Locations_API](./Documentation/SequenceDiagrams/location_api_seq_diagram.pdf)
  - [Messages_API](./Documentation/SequenceDiagrams/messages_api_seq_diagram.pdf)

## Installation

- [Frontend](./frontend/README.md)
- [Backend](./server//README.md)

## Docker Images

- **Backend:** [Vamoose Server](https://hub.docker.com/r/ramanbhandari14/vamoose-server)
- **Frontend:** [Vamoose Frontend](https://hub.docker.com/r/ramanbhandari14/vamoose-frontend)

## Load Tests

Load tests are run using **K6**. Each API endpoint’s load test is executed concurrently with **50 virtual users**. The results are stored in a timestamped directory, containing:

- **JSON Files:** Raw performance data for each endpoint (e.g., `expense.json`, `invite.json`).
- **HTML Reports:** Each endpoint has a dedicated report folder (e.g., `expense.report.html`) that includes a `report.html` file.

### **Report Contents:**
- **Thresholds:** Pass/fail criteria for performance expectations.
- **Checks:** Assertions (e.g., "Expense API ⇀ ✅ Trip created") with pass/fail counts.
- **Metrics:**
  - **Cumulative Data:** Total requests, data sent/received.
  - **Response Times:** Average, median, max, and percentiles (P90, P95).
  - **Virtual Users:** Confirms 50 concurrent users per test.

### **📊 [Access the Latest Report](./server/src/tests/load/reports/2025-03-28T22-46-20-276Z)**

Click the link above to view the most recent load test results. Select an endpoint-specific HTML report inside the directory for detailed performance insights.

## Architecture

![Architecture](./Diagrams/Vamoose-Architecture.jpg)

## Contributing

Please follow the [Contributing Guidelines](./Documentation/CONTRIBUTING.md).

## Team

- **Raman Bhandari** (Team Lead)  
  Email: <bhandar1@myumanitoba.ca>  
  **Roles:** Full Stack and Testing

- **Pritha Das**  
  Email: <dasp4@myumanitoba.ca>  
  **Roles:** Backend Focused

- **Chukwunaza Chukwuocha** (Chuks)  
  Email: <chukwuo1@myumanitoba.ca>  
  **Roles:** Backend Focused

- **Anmolpreet Khangura**
  Email: <khangura@myumanitoba.ca>  
  **Roles:** Full Stack

- **Anmolpreet Singh**  
  Email: <sin121@myumanitoba.ca>  
  **Roles:** Full Stack

## Meeting Times

- **Tuesday:** 6:00 PM
- **Saturday:** 12:00 PM
