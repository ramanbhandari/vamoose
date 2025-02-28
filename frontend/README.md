# Vamoose! Frontend

This is the Next.js (TypeScript) frontend for Vamoose!, a personalized trip planner.

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
