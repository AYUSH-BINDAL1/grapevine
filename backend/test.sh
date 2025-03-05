#!/bin/bash

# Script to set up the development environment for Grapevine application

# Check for stop argument
if [ "$1" == "stop" ]; then
  echo "Stopping processes on port 8080..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PID=$(lsof -ti:8080)
    if [ -n "$PID" ]; then
      echo "Killing process with PID: $PID"
      kill -15 $PID
    else
      echo "No process found running on port 8080"
    fi
  else
    # Linux and other Unix-like systems
    PID=$(netstat -tulpn 2>/dev/null | grep ':8080' | awk '{print $7}' | cut -d'/' -f1)
    if [ -n "$PID" ]; then
      echo "Killing process with PID: $PID"
      kill -15 $PID
    else
      echo "No process found running on port 8080"
    fi
  fi
  exit 0
fi

echo "Starting Docker daemon..."
# Check if Docker is running, if not start it
if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running, attempting to start Docker..."
  # Different commands depending on OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - open Docker Desktop
    open -a Docker
    # Wait for Docker to start
    echo "Waiting for Docker to start..."
    while ! docker info >/dev/null 2>&1; do
      sleep 2
    done
  else
    echo "Please start Docker manually and run this script again"
    exit 1
  fi
fi

echo "Docker is running!"

# Clean up existing containers
echo "Cleaning up containers..."
docker compose down -v

# Build containers
echo "Building containers..."
docker compose up -d

# Wait for mailpit to be ready
echo "Waiting for Mailpit to be ready..."
while ! curl -s http://localhost:8025 > /dev/null; do
  sleep 2
done

echo "Mailpit is ready!"

# Set the backend URL
BACKEND_URL="http://localhost:8080"

# Check if the Spring Boot application is already running
echo "Checking if Spring Boot application is running..."
if lsof -i :8080 > /dev/null; then
  echo "Port 8080 is already in use, assuming Spring Boot is running"
else
  echo "Starting Spring Boot application..."
  # Add your command to start the Spring Boot application
  # For example:
  # cd path/to/your/project && ./mvnw spring-boot:run &
  # Or
  # java -jar target/your-application.jar &
  
  # Replace with your actual command
  ./mvnw spring-boot:run &
  
  # Wait for application to start
  echo "Waiting for Spring Boot to start..."
  while ! curl -s $BACKEND_URL/users/register >/dev/null 2>&1; do
    sleep 2
  done
fi

echo "Spring Boot application is running!"

# Register and verify users
register_and_verify_user() {
  local email=$1
  local password=$2
  local name=$3

  echo "Registering user: $email"
  TOKEN=$(curl -s --location --request POST "$BACKEND_URL/users/register" \
    --header 'Content-Type: application/json' \
    --data-raw "{
      \"userEmail\": \"$email\",
      \"password\": \"$password\",
      \"name\": \"$name\",
      \"birthday\": \"2000-01-01\"
    }" | tr -d '"')

  echo "Verification token for $email: $TOKEN"
  
  echo "Verifying user: $email"
  curl -s --location --request POST "$BACKEND_URL/users/verify?token=$TOKEN" \
    --header 'Content-Type: application/json' \
    --data-raw "{
      \"userEmail\": \"$email\",
      \"password\": \"$password\",
      \"name\": \"$name\",
      \"birthday\": \"2000-01-01\"
    }"
  
  echo -e "\nUser $email registered and verified successfully!"
}

# Register two users
register_and_verify_user "user1@purdue.edu" "pw1" "Test UserOne"
register_and_verify_user "user2@purdue.edu" "pw2" "Test UserTwo"

echo -e "\nLogin to test the users:"
echo "curl -X POST $BACKEND_URL/users/login -H 'Content-Type: application/json' -d '{\"email\": \"testuser1@example.com\", \"password\": \"pw1\"}'"
echo "curl -X POST $BACKEND_URL/users/login -H 'Content-Type: application/json' -d '{\"email\": \"testuser2@example.com\", \"password\": \"pw2\"}'"

echo -e "\nSample command to create a group (replace SESSION_ID with actual session ID):"
echo "curl -X POST $BACKEND_URL/groups/create -H 'Content-Type: application/json' -H 'Session-Id: SESSION_ID' -d '{\"name\": \"Study Group\", \"description\": \"A group for studying\", \"maxUsers\": 10}'"

echo -e "\nSetup complete! The application is ready for testing."
