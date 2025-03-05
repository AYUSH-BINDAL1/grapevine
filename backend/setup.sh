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

# Check for arguments
if [ "$1" == "stop" ]; then
  cleanup
fi

if [ "$1" == "test" ]; then
  run_tests
fi

# Check if port 8080 is already in use
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
  echo -e "${RED}Error: Port 8080 is already in use. Stop the service using that port first.${NC}"
  echo -e "${YELLOW}You can use 'lsof -i :8080' to identify the process${NC}"
  exit 1
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

# Register two users
register_and_verify_user "user1@purdue.edu" "pw1" "Test UserOne"
register_and_verify_user "user2@purdue.edu" "pw2" "Test UserTwo"

echo -e "\n${GREEN}Login to test the users:${NC}"
echo "curl -X POST $BACKEND_URL/users/login -H 'Content-Type: application/json' -d '{\"email\": \"user1@purdue.edu\", \"password\": \"pw1\"}'"
echo "curl -X POST $BACKEND_URL/users/login -H 'Content-Type: application/json' -d '{\"email\": \"user2@purdue.edu\", \"password\": \"pw2\"}'"

echo -e "\n${GREEN}Setup complete! The application is running in Docker containers.${NC}"
echo -e "Access the application at http://localhost:8080"
echo -e "Access Mailpit at http://localhost:8025"
echo -e "To stop all containers, run: ./setup.sh stop"
echo -e "To run unit tests, run: ./setup.sh test"