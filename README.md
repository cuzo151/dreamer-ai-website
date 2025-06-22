# Dreamer AI Solutions Website

Professional website for Dreamer AI Solutions featuring AI-powered capabilities and interactive demos.

## Features

- Professional landing page with modern design
- AI-powered chat assistant
- Interactive capability demonstrations
- Document analysis demo
- Contact form integration
- Responsive design for all devices

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Styling**: Tailwind CSS with custom theme

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd dreamer-ai-website
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Set up environment variables:

Backend (.env):
```
PORT=5000
FRONTEND_URL=http://localhost:3000
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

Frontend (.env):
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm start
```

3. Open http://localhost:3000 in your browser

## Deployment

### Frontend
- Build: `npm run build`
- Deploy the `build` folder to your hosting service (dreamerai.io)

### Backend
- Deploy to your preferred Node.js hosting service
- Update environment variables for production

## Contact

- Support: support@dreamerai.io
- Direct: jlasalle@dreamerai.io
- Website: dreamerai.io