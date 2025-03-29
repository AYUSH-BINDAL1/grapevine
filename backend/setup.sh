#!/bin/bash

# simple script for running the application with all dependencies
# note: this script should be run from a UNIX-based shell (e.g., Git Bash on Windows)

# INSTRUCTIONS:
   #1. Make the script executable:
   #chmod +x setup.sh
   #2. Run the script to start everything:
   #./setup.sh
   #3. To stop all services:
   #./setup.sh stop
   #4. To run unit tests:
   #./setup.sh test
   #5. To open PostgreSQL console:
   #./setup.sh db

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to clean up
cleanup() {
  echo -e "${YELLOW}Stopping Docker containers...${NC}"
  docker compose down
  exit 0
}

# Function to run tests
run_tests() {
  echo -e "${BLUE}Running unit tests...${NC}"
  ./mvnw test
  TEST_EXIT_CODE=$?
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
  else
    echo -e "${YELLOW}Some tests failed. See above for details.${NC}"
  fi
  exit $TEST_EXIT_CODE
}

# Function to open PostgreSQL console
open_db_console() {
  echo -e "${BLUE}Opening PostgreSQL console...${NC}"
  docker exec -it backend-postgres-1 psql -U postgres
  exit 0
}

# Function to redeploy Spring Boot application
redeploy_app() {
  echo -e "${BLUE}Redeploying Spring Boot application...${NC}"

  # Build the app with Maven
  ./mvnw clean package -DskipTests

  # Restart just the backend container
  docker compose up -d --build backend

  # Fixed delay instead of checking readiness
  echo -e "${GREEN}Waiting 10 seconds for Spring Boot application to initialize...${NC}"
  sleep 10


  echo -e "${GREEN}Spring Boot application redeployment completed!${NC}"
  exit 0
}

setup_bucket() {
  echo -e "\n${GREEN}Setting up MinIO bucket...${NC}"

  echo "Waiting for MinIO to become available..."
  MAX_RETRIES=30
  RETRY_COUNT=0

  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:9000/minio/health/live > /dev/null; then
      echo "MinIO is up and running!"
      sleep 5
      break
    fi

    echo "Waiting for MinIO to start... ($(($RETRY_COUNT + 1))/$MAX_RETRIES)"
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
      echo -e "${RED}MinIO failed to start within the expected time.${NC}"
      return 1
    fi
  done

  # Find the MinIO container ID
  MINIO_CONTAINER=$(docker ps | grep minio/minio | awk '{print $1}')

  if [ -z "$MINIO_CONTAINER" ]; then
    echo -e "${RED}MinIO container not found${NC}"
    return 1
  fi

  echo "Setting up MinIO client..."
  docker exec $MINIO_CONTAINER mc alias set local http://localhost:9000 minioadmin minioadmin

  echo "Creating bucket..."
  docker exec $MINIO_CONTAINER mc mb --ignore-existing local/images

  echo "Setting public access policy..."
  docker exec $MINIO_CONTAINER mc anonymous set download local/images

  echo -e "${GREEN}MinIO bucket 'images' created with public access${NC}"
}

# Check for arguments
if [ "$1" == "stop" ]; then
  cleanup
fi

if [ "$1" == "test" ]; then
  run_tests
fi

if [ "$1" == "db" ]; then
  open_db_console
fi

if [ "$1" == "r" ]; then
  redeploy_app
fi

# Check if port 8080 is already in use and kill the process if found
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
  PID=$(lsof -Pi :8080 -sTCP:LISTEN -t)
  echo -e "${YELLOW}Port 8080 is in use by process $PID. Killing process...${NC}"
  kill -9 $PID
  sleep 2
  echo -e "${GREEN}Process using port 8080 has been terminated.${NC}"
fi

# Start Docker containers
echo -e "${GREEN}Starting Docker containers...${NC}"
docker compose up -d --build

# Set the backend URL
BACKEND_URL="http://localhost:8080"

# Wait for the application to be ready
echo -e "${GREEN}Waiting for Spring Boot application to start...${NC}"
while ! curl -s $BACKEND_URL/users/register >/dev/null 2>&1; do
  echo "Waiting for application to become available..."
  sleep 5
done

echo -e "${GREEN}Spring Boot application is running!${NC}"

# Register and verify users
register_and_verify_user() {
  local email=$1
  local password=$2
  local name=$3

  echo -e "${GREEN}Registering user: $email${NC}"
  TOKEN=$(curl -s --location --request POST "$BACKEND_URL/users/register" \
    --header 'Content-Type: application/json' \
    --data-raw "{
      \"userEmail\": \"$email\",
      \"password\": \"$password\",
      \"name\": \"$name\",
      \"birthday\": \"2000-01-01\"
    }" | tr -d '"')

  echo "Verification token for $email: $TOKEN"

  echo -e "${GREEN}Verifying user: $email${NC}"
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

create_groups_for_user1() {
  echo -e "\n${GREEN}Logging in as user1 to get session ID...${NC}"
  SESSION_ID=$(curl -s -X POST "$BACKEND_URL/users/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "user1@purdue.edu", "password": "pw1"}' | grep -o '"sessionId":"[^"]*' | sed 's/"sessionId":"//g')

  echo "Session ID for user1: $SESSION_ID"

  echo -e "\n${GREEN}Creating 5 groups for user1...${NC}"

  # Group 1: CS 307 Study Group
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "CS 307 Study Group",
      "description": "A collaborative study group for CS 307 Software Engineering. We meet twice a week to discuss course material, work on projects, and prepare for exams. All skill levels welcome!",
      "maxUsers": 25
    }'
  echo -e "${GREEN}Created: CS 307 Study Group${NC}"

  # Group 2: Calculus III Study Group
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "Calculus III Study Group",
      "description": "Dedicated to mastering multivariable calculus. We work through complex problems together and explain concepts to each other. Join us to conquer Calc III!",
      "maxUsers": 15
    }'
  echo -e "${GREEN}Created: Calculus III Study Group${NC}"

  # Group 3: Organic Chemistry Group
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "Organic Chemistry Group",
      "description": "Focus on mastering organic chemistry concepts, reaction mechanisms, and lab techniques. We help each other prepare for exams and understand difficult topics.",
      "maxUsers": 20
    }'
  echo -e "${GREEN}Created: Organic Chemistry Group${NC}"

  # Group 4: Algorithm Practice
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "Algorithm Practice",
      "description": "Weekly algorithm problem solving sessions. We tackle leetcode problems and discuss efficient solutions and techniques.",
      "maxUsers": 12
    }'
  echo -e "${GREEN}Created: Algorithm Practice${NC}"

  # Group 5: Web Development Club
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "Web Development Club",
      "description": "Learn and practice modern web technologies including React, Node.js, and cloud deployment. Beginners and experts welcome!",
      "maxUsers": 18
    }'
  echo -e "${GREEN}Created: Web Development Club${NC}"

  echo -e "\n${GREEN}Successfully created 5 groups for user1@purdue.edu${NC}"
}

set_instructor_role() {
  echo -e "\n${GREEN}Setting user1 as instructor...${NC}"

  # Login to get session ID
  echo "Logging in as user1..."
  LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/users/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "user1@purdue.edu", "password": "pw1"}')

  SESSION_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionId":"[^"]*' | sed 's/"sessionId":"//g')

  if [ -z "$SESSION_ID" ]; then
    echo -e "${RED}Failed to login as user1${NC}"
    return 1
  fi

  echo "Session ID: $SESSION_ID"

  # Get current user details
  USER_DATA=$(curl -s -X GET "$BACKEND_URL/users/user1@purdue.edu" \
    -H "Session-Id: $SESSION_ID")

  # Update user data with instructor role
  echo "Updating user role to INSTRUCTOR..."
  UPDATED_USER=$(echo "$USER_DATA" | sed 's/"role":"STUDENT"/"role":"INSTRUCTOR"/g')

  # Send update request
  RESULT=$(curl -s -X PUT "$BACKEND_URL/users/user1@purdue.edu" \
    -H "Content-Type: application/json" \
    -H "Session-Id: $SESSION_ID" \
    -d "$UPDATED_USER")

  echo -e "${GREEN}User1 role updated to instructor successfully!${NC}"
}

# Register two users
register_and_verify_user "user1@purdue.edu" "pw1" "Test UserOne"
register_and_verify_user "user2@purdue.edu" "pw2" "Test UserTwo"

# Create groups for user1
create_groups_for_user1

# Set user1 as instructor
set_instructor_role

echo -e "\n${GREEN}Login to test the users:${NC}"
echo "curl -X POST $BACKEND_URL/users/login -H 'Content-Type: application/json' -d '{\"email\": \"user1@purdue.edu\", \"password\": \"pw1\"}'"
echo "curl -X POST $BACKEND_URL/users/login -H 'Content-Type: application/json' -d '{\"email\": \"user2@purdue.edu\", \"password\": \"pw2\"}'"

setup_bucket

echo -e "\n${GREEN}Setup complete! The application is running in Docker containers.${NC}"
echo -e "Access the application at http://localhost:8080"
echo -e "Access Mailpit at http://localhost:8025"
echo -e "Access MinIO Console at http://localhost:9001 (login: minioadmin/minioadmin)"
echo -e "To stop all containers, run: ./setup.sh stop"
echo -e "To run unit tests, run: ./setup.sh test"
echo -e "To access the PostgreSQL console, run: ./setup.sh db"