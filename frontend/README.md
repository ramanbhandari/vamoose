# Vamoose! Frontend

This is the Next.js (TypeScript) frontend for Vamoose!, a personalized trip planner.

Visit it Live at: [vamoose.vercel.app](https://vamoose.vercel.app/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository and navigate to the frontend folder.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running in Development

Start the development server with:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Building for Production

### Build

Create an optimized production build with:

```bash
npm run build
```

### Start Production Server

Run the production server locally:

```bash
npm start
```

Ensure your environment variables (see below) are set correctly.

## Testing

Run test:

```bash
npm run test
```

## Docker

### Building the Docker Image

From the frontend folder, run:

```bash
docker build -t vamoose-frontend .
```

### Running the Docker Container

Run the container locally on port 3000:

```bash
docker run -p 3000:3000 vamoose-frontend
```

Open http://localhost:3000 to view the app.

## Additional Scripts

### Linting

```bash
npm run lint
```

## Continuous Integration & Workflows

The CI pipelines perform the following tasks on every pull request (PR) targeting the `main`, `uat`, or `dev` branches:

### Build:

The project is built to catch any compile-time errors.

### Testing:

All tests are executed to ensure the application behaves as expected.

### Linting & Formatting:

The code is linted and formatted using ESLint and Prettier to maintain a consistent code style.

## PR Validation:

1. The workflow checks that all required PR labels are added (none are empty).
2. At least one review is required before merging.
3. All automated checks (build, tests, linting) must pass before the PR can be merged.

## Continuous Deployment

### Backend Deployment on GCP

Our backend is deployed on `Google Cloud Run` using a Docker-based workflow. The repository includes a Dockerfile located in the server directory. When changes are pushed to the repository, our Cloud Build pipeline is triggered, which:

1. Picks up the Dockerfile from the server folder.
2. Builds a container image.
3. Deploys the updated image to Cloud Run.

The URL from there is used by the frontend for API calls.

### Frontend Deployment on Vercel

Our frontend is deployed on Vercel. Vercel is configured to automatically redeploy the application on every push to the main branch. Once the build completes, Vercel serves the updated site directly from the repository.

Any changes pushed to the main branch trigger a new deployment, ensuring that live site is always up to date.
