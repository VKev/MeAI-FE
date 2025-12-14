# MeAI - Multi Media AI Powered Content Creation Management Platform

<div align="center">

![MeAI Logo](public/logo.svg)

**Empowering creators with AI-driven multimedia content generation and management**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React Router](https://img.shields.io/badge/React%20Router-v7-red.svg)](https://reactrouter.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC.svg)](https://tailwindcss.com/)

[Features](#features) • [Getting Started](#getting-started) • [Architecture](#architecture) • [Deployment](#deployment) • [Documentation](#documentation)

</div>

---

## 📋 Overview

**MeAI** is a next-generation content creation management platform that leverages artificial intelligence to streamline multimedia content production workflows. Designed for content creators, marketers, and creative teams, MeAI provides intelligent tools for generating, editing, and managing various types of media content at scale.

### Key Capabilities

- 🎨 **AI-Powered Content Generation** - Create high-quality text, images, videos, and audio using advanced AI models
- 🖼️ **Multi-Format Support** - Seamlessly work with text, images, video, audio, and mixed media projects
- 🔄 **Intelligent Workflow Automation** - Automate repetitive tasks and content optimization processes
- 📊 **Content Management Dashboard** - Centralized hub for organizing and tracking all your creative assets
- 🤝 **Collaboration Tools** - Real-time collaboration features for teams
- 🎯 **Brand Consistency** - AI-assisted brand guideline enforcement across all content
- 📈 **Analytics & Insights** - Track content performance and engagement metrics

---

## ✨ Features

### Content Creation
- **Text Generation**: AI-powered copywriting, blog posts, social media captions, and more
- **Image Generation**: Create custom visuals from text descriptions using advanced diffusion models
- **Video Production**: Automated video editing, subtitle generation, and scene composition
- **Audio Synthesis**: Text-to-speech, voice cloning, and background music generation
- **Template Library**: Pre-built templates for common content types and formats

### Content Management
- **Asset Organization**: Intuitive folder structure and tagging system
- **Version Control**: Track changes and maintain version history for all assets
- **Search & Discovery**: Powerful AI-enhanced search across all content types
- **Batch Operations**: Process multiple assets simultaneously
- **Export Options**: Support for various file formats and quality settings

### Platform Features
- **User Authentication**: Secure login with role-based access control
- **Team Workspaces**: Isolated environments for different projects and teams
- **API Integration**: Connect with third-party tools and services
- **Cloud Storage**: Secure, scalable storage for all your content
- **Real-time Collaboration**: Multi-user editing and commenting
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **pnpm** / **yarn**
- **Git** for version control

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-organization/MeAI_FE.git
cd MeAI_FE
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://api.meai.com
VITE_AI_SERVICE_URL=https://ai.meai.com
VITE_STORAGE_BUCKET=meai-assets
VITE_APP_ENV=development
```

4. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Development Commands

```bash
# Start development server with HMR
npm run dev

# Run TypeScript type checking
npm run typecheck

# Lint code with ESLint
npm run lint

# Format code with Prettier
npm run format

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

---

## 🏗️ Architecture

### Technology Stack

**Frontend Framework**
- ⚛️ **React 18** - Modern UI library with concurrent features
- 🛣️ **React Router v7** - Full-stack routing and data loading
- 📘 **TypeScript** - Type-safe development experience

**Styling & UI**
- 🎨 **TailwindCSS** - Utility-first CSS framework
- 🧩 **Headless UI** - Accessible component primitives
- 🌈 **Radix UI** - High-quality component library

**State Management**
- 🔄 **Zustand** - Lightweight state management
- 🔍 **React Query** - Server state and caching

**Build Tools**
- ⚡️ **Vite** - Next-generation frontend tooling
- 📦 **ESBuild** - Extremely fast JavaScript bundler

### Project Structure

```
MeAI_FE/
├── app/                      # Application core
│   ├── routes/              # Route components
│   ├── components/          # Shared React components
│   ├── services/            # API service layer
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── models/              # TypeScript interfaces/types
│   └── root.tsx             # Application root
├── public/                   # Static assets
├── build/                    # Production build output
├── tests/                    # Test suites
└── config/                   # Configuration files
```

### Key Directories

- **`app/routes/`** - File-based routing with React Router
- **`app/components/`** - Reusable UI components
- **`app/services/`** - API clients and business logic
- **`app/hooks/`** - Custom React hooks for shared logic
- **`app/models/`** - TypeScript type definitions and interfaces
- **`app/utils/`** - Helper functions and utilities

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API endpoint | ✅ |
| `VITE_AI_SERVICE_URL` | AI service endpoint | ✅ |
| `VITE_STORAGE_BUCKET` | Cloud storage bucket name | ✅ |
| `VITE_APP_ENV` | Environment (development/staging/production) | ✅ |
| `VITE_ANALYTICS_ID` | Analytics tracking ID | ❌ |
| `VITE_SENTRY_DSN` | Error tracking DSN | ❌ |

### Build Configuration

The application uses Vite for building and bundling. Configuration can be found in `vite.config.ts`.

---

## 📦 Building for Production

### Create Production Build

```bash
npm run build
```

This generates optimized assets in the `build/` directory:

```
build/
├── client/          # Static assets (HTML, CSS, JS, images)
└── server/          # Server-side rendering code
```

### Preview Production Build

```bash
npm run preview
```

---

## 🚢 Deployment

### Docker Deployment

**Build the Docker image:**

```bash
docker build -t meai-frontend:latest .
```

**Run the container:**

```bash
docker run -p 3000:3000 \
  -e VITE_API_BASE_URL=https://api.meai.com \
  -e VITE_AI_SERVICE_URL=https://ai.meai.com \
  meai-frontend:latest
```

**Using Docker Compose:**

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=https://api.meai.com
      - VITE_AI_SERVICE_URL=https://ai.meai.com
    restart: unless-stopped
```

### Cloud Platform Deployment

**AWS (ECS/Fargate)**
- Build and push Docker image to ECR
- Create ECS task definition
- Deploy to ECS cluster with load balancer

**Google Cloud Run**
```bash
gcloud run deploy meai-frontend \
  --image gcr.io/PROJECT_ID/meai-frontend \
  --platform managed \
  --region us-central1
```

**Azure Container Apps**
```bash
az containerapp up \
  --name meai-frontend \
  --resource-group meai-rg \
  --image meai-frontend:latest
```

**Vercel / Netlify**
- Connect your Git repository
- Configure build command: `npm run build`
- Set environment variables in platform settings
- Deploy automatically on push to main branch

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Testing Strategy

- **Unit Tests**: Component logic and utilities
- **Integration Tests**: API services and data flows
- **E2E Tests**: Critical user journeys
- **Visual Regression**: UI consistency checks

---

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR


---

## 🆘 Support

### Documentation

- [User Guide](docs/user-guide.md)
- [API Documentation](docs/api.md)
- [Component Library](docs/components.md)
- [Development Guide](docs/development.md)

---

## 🙏 Acknowledgments

- React Router team for the excellent framework
- OpenAI for AI model integration
- All our contributors and community members

---

<div align="center">

**Built with ❤️ by the MeAI Team**

© 2025 MeAI Platform. All rights reserved.

</div>
