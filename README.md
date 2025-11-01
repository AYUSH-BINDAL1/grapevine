# Grapevine - Study Group Finder

A full-stack social platform connecting college students through study groups, events, and real-time messaging. Built with React, Spring Boot, and PostgreSQL, featuring WebSocket-based notifications and a complete CI/CD pipeline deployed on AWS.

## Overview

Grapevine solves the challenge of finding study partners by creating a centralized platform where students can discover groups, schedule study sessions, and communicate in real-time. The platform handles user authentication, complex search filtering, role-based access control, and live messaging.

**Key Achievement:** Successfully deployed a production-grade application with containerized services, automated CI/CD, and real-time communication supporting concurrent users across multiple study groups.

## Architecture

```
React Frontend ↔ Spring Boot REST API ↔ PostgreSQL Database
                      ↕
                 WebSocket Server (Real-time messaging & notifications)
                      ↓
              AWS Infrastructure (EC2, S3, SES)
```

### Core Components

- **React Frontend** - Single-page application with component-based architecture and state management
- **Spring Boot Backend** - RESTful API handling authentication, CRUD operations, and business logic
- **PostgreSQL Database** - Relational database with optimized schema for users, groups, events, and relationships
- **WebSocket Server** - Bidirectional communication layer for instant messaging and live notifications
- **Docker Environment** - Containerized services orchestrated with Docker Compose for consistent deployment
- **CI/CD Pipeline** - GitHub Actions automating testing and deployment to AWS EC2

## Core Features

### User Management
- School email authentication with verification via AWS SES
- Profile management with course enrollment tracking
- Profile picture uploads stored in AWS S3
- Role-based permissions (Student, Instructor, GTA, UTA)
- Personal availability scheduling

### Study Groups & Discovery
- Create and join study groups organized by course or topic
- Advanced search and filtering (by course, location, time, availability)
- Location-based matching for preferred study spots
- Group member management and permissions

### Events & Scheduling
- Schedule study sessions tied to specific groups
- Calendar integration with time conflict detection
- Event notifications via WebSocket
- Search and filter upcoming events by course or group

### Social Features
- Friend system with connection requests
- Real-time messaging between friends and group members
- Reddit-style Q&A forums for course discussions
- Notification system for friend requests, event reminders, and group updates

## Technical Challenges Solved

1. **Database Design** - Engineered normalized schema handling complex many-to-many relationships between users, groups, courses, and events while maintaining referential integrity and query performance

2. **WebSocket Architecture** - Implemented bidirectional WebSocket communication for real-time messaging and notifications, managing connection lifecycles and ensuring message delivery across concurrent sessions

3. **Authentication & Authorization** - Built secure JWT-based authentication with role-based access control, protecting endpoints and managing session state across frontend and backend

4. **Containerization & Deployment** - Dockerized multi-service application with Docker Compose, configuring network bridges and persistent volumes for database state management

5. **CI/CD Pipeline** - Automated testing and deployment workflow with GitHub Actions, including build verification, Docker image creation, and zero-downtime deployment to AWS EC2

## Tech Stack

**Frontend:** React.js for component-based UI development with responsive design

**Backend:** Spring Boot (Java) providing RESTful APIs with built-in dependency injection and transaction management

**Database:** PostgreSQL with complex relational schema and indexed queries for performance

**Real-time Communication:** WebSocket protocol for low-latency bidirectional messaging

**Infrastructure:** 
- Docker & Docker Compose for containerization
- AWS EC2 for application hosting
- AWS S3 for image storage
- AWS SES for email verification
- GitHub Actions for automated CI/CD

**Deployment:** Netlify for frontend hosting, AWS EC2 for backend services

## Example Use Cases

Students use Grapevine to:
- Find CS majors forming a group for Data Structures exam prep at the library
- Schedule weekly calculus study sessions with automatic reminders
- Join a machine learning reading group meeting Tuesdays at the student union
- Message classmates about homework questions in real-time
- Discover events for courses they're enrolled in across campus

## What I Learned

- **Full-Stack Development** - Experience building and integrating React frontend with Spring Boot backend through RESTful APIs
- **Database Architecture** - Deep understanding of relational database design, normalization, and query optimization for complex social features
- **Real-time Systems** - Implementation of WebSocket protocol for bidirectional communication and event-driven notifications
- **DevOps Practices** - Hands-on experience with Docker containerization, CI/CD pipelines, and cloud deployment on AWS
- **Authentication & Security** - JWT implementation, password hashing, email verification, and role-based access control
- **System Design** - Architecting scalable multi-service applications with proper separation of concerns

This project demonstrated how to build production-ready web applications from scratch, covering every layer from database design to cloud deployment, while solving real-world problems in the education technology space.