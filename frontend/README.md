# GrapeVine - University Study Partner Platform

GrapeVine is a comprehensive web application that connects university students with study partners, groups, and events based on courses, schedules, and preferred locations.

## Features

- **User Authentication**: Register, login, and profile management
- **Groups**: Create and join study groups
- **Events**: Schedule and participate in study events
- **Course Management**: Add/remove courses from your profile
- **Friends System**: Connect with other students
- **Availability Management**: Share your study schedule
- **Location Preferences**: Set preferred study locations
- **Profile Pictures**: Upload and manage your profile image
- **Role-based Access**: Different features for students, instructors, GTAs, and UTAs

## Project Structure

The frontend is organized into components, with key features including:

- **Authentication**: Login, Registration, and Confirmation components
- **Profile Management**: Personal profile and user profiles
- **Groups & Events**: Creation, viewing, and participation
- **Course System**: Search and enrollment
- **Friends System**: Finding and connecting with others

## Technologies Used

- **React**: UI framework
- **Vite**: Build tool
- **Axios**: API client
- **React Router**: Navigation
- **React Toastify**: Notifications

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Backend server running on port 8080
- Image server running on port 9000

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/grapevine.git
   cd grapevine/frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

## Running the Application

1. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Access the application:
   Open your browser and navigate to `http://localhost:5173`

3. Make sure the backend servers are running:
   - Main API server on `http://localhost:8080`
   - Image server on `http://localhost:9000`
   - Mailpit server on '<http://localhost:8025/>'

## Building for Production

1. Create a production build:

   ```bash
   npm run build
   # or
   yarn build
   ```

2. The compiled files will be in the `dist` directory, which you can serve using any static file server.

## Development Notes

- The application requires a valid backend server and image server to function properly
- User registration requires email verification
- Student roles have access to all features
- Instructor roles have additional access to view enrolled students

## Configuration

Environment variables can be configured in a `.env` file:

``` JavaScipt
VITE_API_URL=http://localhost:8080
VITE_IMAGE_URL=http://localhost:9000
```

## Troubleshooting

- If you see CORS errors, ensure the backend has proper CORS configuration
- If images don't load, verify the image server is running correctly
- Login issues may require clearing localStorage and cookies
