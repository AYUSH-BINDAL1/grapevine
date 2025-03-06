#!/bin/bash

# simple script for running the application with all dependencies
# note: this script is for unix-based systems only (macOS, linux)
#       if you are using windows, please run setup.bat instead

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

# Add this function after the register_and_verify_user function
create_groups_for_user1() {
  echo -e "\n${GREEN}Logging in as user1 to get session ID...${NC}"
  SESSION_ID=$(curl -s -X POST "$BACKEND_URL/users/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "user1@purdue.edu", "password": "pw1"}' | grep -o '"sessionId":"[^"]*' | sed 's/"sessionId":"//g')

  echo "Session ID for user1: $SESSION_ID"

  echo -e "\n${GREEN}Creating 5 groups for user1...${NC}"

  # Group 1: Java Study Group
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "Java Study Group",
      "description": "A group to study Java and Spring Boot",
      "maxUsers": 15
    }'
  echo -e "${GREEN}Created: Java Study Group${NC}"

  # Group 2: Algorithm Practice
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "Algorithm Practice",
      "description": "Weekly algorithm problem solving sessions",
      "maxUsers": 12
    }'
  echo -e "${GREEN}Created: Algorithm Practice${NC}"

  # Group 3: Web Development Club
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "Web Development Club",
      "description": "Learn and practice modern web technologies",
      "maxUsers": 20
    }'
  echo -e "${GREEN}Created: Web Development Club${NC}"

  # Group 4: Database Systems
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "Database Systems",
      "description": "SQL and NoSQL database discussion group",
      "maxUsers": 10
    }'
  echo -e "${GREEN}Created: Database Systems${NC}"

  # Group 5: Machine Learning Lab
  curl -s --location --request POST "$BACKEND_URL/groups/create" \
    --header "Content-Type: application/json" \
    --header "Session-Id: $SESSION_ID" \
    --data '{
      "name": "Machine Learning Lab",
      "description": "Hands-on projects with ML frameworks",
      "maxUsers": 15
    }'
  echo -e "${GREEN}Created: Machine Learning Lab${NC}"

  echo -e "\n${GREEN}Successfully created 5 groups for user1@purdue.edu${NC}"
}

# Register two users
register_and_verify_user "user1@purdue.edu" "pw1" "Test UserOne"
register_and_verify_user "user2@purdue.edu" "pw2" "Test UserTwo"

# Create groups for user1
create_groups_for_user1

echo -e "\n${GREEN}Login to test the users:${NC}"
echo "curl -X POST $BACKEND_URL/users/login -H 'Content-Type: application/json' -d '{\"email\": \"user1@purdue.edu\", \"password\": \"pw1\"}'"
echo "curl -X POST $BACKEND_URL/users/login -H 'Content-Type: application/json' -d '{\"email\": \"user2@purdue.edu\", \"password\": \"pw2\"}'"

echo -e "\n${GREEN}Setup complete! The application is running in Docker containers.${NC}"
echo -e "Access the application at http://localhost:8080"
echo -e "Access Mailpit at http://localhost:8025"
echo -e "To stop all containers, run: ./setup.sh stop"
echo -e "To run unit tests, run: ./setup.sh test"
echo -e "To access the PostgreSQL console, run: ./setup.sh db"