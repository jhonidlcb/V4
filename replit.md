# SoftwarePar - Full-Stack Software Development Platform

## Overview

SoftwarePar is a comprehensive software development platform built for the Argentine market, offering custom software development services with integrated client management, partner referral programs, and payment processing. The platform serves as a complete business solution for managing software projects from initial client contact through development, payment, and ongoing support.

The system supports three user roles: administrators who manage the entire platform, partners who earn commissions through referrals, and clients who purchase and track their software projects. Key features include project management with progress tracking, multi-stage payment processing via MercadoPago, integrated support ticketing, WhatsApp notifications via Twilio, and a comprehensive portfolio showcase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 using TypeScript and Vite as the build tool. The UI leverages shadcn/ui components with Radix UI primitives and Tailwind CSS for styling. State management is handled through TanStack Query for server state and React's built-in state for local UI state. The application uses Wouter for client-side routing and Framer Motion for animations.

The component structure follows a modular approach with reusable UI components in the `/components/ui` directory and feature-specific components organized by functionality. The application supports responsive design with mobile-first approach and includes real-time notifications through WebSocket connections.

### Backend Architecture
The backend is built with Express.js and TypeScript, following a RESTful API design pattern. The server implements JWT-based authentication with role-based access control (RBAC) supporting admin, partner, and client roles. Password hashing is handled through bcryptjs for security.

The API routes are organized by feature domains (auth, users, projects, payments, etc.) with middleware for authentication, authorization, and request validation using Zod schemas. The server includes WebSocket support for real-time notifications and file upload capabilities for project assets.

### Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema is defined in TypeScript with proper relationships between entities. Key tables include users, partners, projects, payment stages, tickets, notifications, and portfolio items.

Database migrations are managed through Drizzle Kit, and the connection is established using Neon's serverless PostgreSQL driver. The schema includes proper indexing for performance and foreign key constraints for data integrity.

### Authentication & Authorization
JWT-based authentication system with tokens stored in localStorage on the frontend. Role-based access control restricts access to different parts of the application based on user roles. Authentication middleware validates tokens on protected routes and maintains user sessions.

Password security is implemented using bcryptjs with proper salt rounds. The system includes password reset functionality and account activation flows via email notifications.

### Payment Processing
Integration with MercadoPago for handling payments in the Argentine market. The system supports multi-stage payment processing where projects can be broken down into payment milestones based on development progress. Payment configurations are stored in the database and can be updated by administrators.

The payment flow includes automatic payment link generation, webhook handling for payment status updates, and commission calculations for partner referrals.

### Communication Systems
Dual communication channels through email (Gmail SMTP) and WhatsApp (Twilio API). Email notifications are sent for account creation, project updates, and important system events. WhatsApp integration provides instant notifications for critical updates and can be configured per user preference.

Real-time notifications are delivered through WebSocket connections, allowing immediate updates for project changes, new messages, and system alerts without page refreshes.

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting with connection pooling and automatic scaling
- **Drizzle ORM**: Type-safe database toolkit with schema migrations and query builder

### Payment Processing
- **MercadoPago**: Payment gateway for processing payments in Latin American markets, supporting credit cards, bank transfers, and local payment methods

### Communication Services
- **Gmail SMTP**: Email delivery service for transactional emails including welcome messages, notifications, and password resets
- **Twilio**: WhatsApp Business API integration for instant messaging and notifications to users

### Frontend Libraries
- **React Query (TanStack Query)**: Server state management with caching, background updates, and optimistic updates
- **Radix UI**: Unstyled, accessible UI primitives for building the design system
- **Tailwind CSS**: Utility-first CSS framework for responsive design and consistent styling
- **Framer Motion**: Animation library for smooth transitions and micro-interactions

### Development & Build Tools
- **Vite**: Frontend build tool with hot module replacement and optimized production builds
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast JavaScript bundler for server-side code compilation
- **Zod**: Runtime type validation for API requests and responses