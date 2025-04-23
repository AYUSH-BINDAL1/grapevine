#!/bin/bash

# Simple script for running the application with all dependencies
# Note: this script should be run from a UNIX-based shell (e.g., Git Bash or WSL on Windows)

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

# EC2 specific settings
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
export HOME=${HOME:-/home/ubuntu}  # Ensure HOME is set

# Detect which docker compose command is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}Neither docker-compose nor docker compose is available. Please install Docker and Docker Compose.${NC}"
    echo -e "${YELLOW}Run: sudo apt update && sudo apt install -y docker.io docker-compose${NC}"
    exit 1
fi

echo -e "${GREEN}Using $DOCKER_COMPOSE for container orchestration${NC}"

# Check if Docker is running
if command -v systemctl &> /dev/null && ! systemctl is-active --quiet docker; then
    echo -e "${YELLOW}Docker is not running. Attempting to start...${NC}"
    sudo systemctl start docker
    sleep 2
    if ! systemctl is-active --quiet docker; then
        echo -e "${RED}Failed to start Docker. Please check Docker installation.${NC}"
        exit 1
    fi
fi

# Check if user can access Docker socket
if ! docker info &>/dev/null; then
    echo -e "${YELLOW}Cannot connect to Docker daemon. Adding current user to docker group...${NC}"
    sudo usermod -aG docker $USER
    echo -e "${RED}Please log out and log back in, then run this script again.${NC}"
    echo -e "${YELLOW}Or run: exec su -l $USER${NC}"
    exit 1
fi

# Function to clean up
cleanup() {
  echo -e "${YELLOW}Stopping Docker containers...${NC}"
  $DOCKER_COMPOSE down
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
  docker exec -it backend_postgres_1 psql -U postgres
  exit 0
}

# Function to redeploy Spring Boot application
redeploy_app() {
  echo -e "${BLUE}Redeploying Spring Boot application...${NC}"

  # Build the app with Maven
  ./mvnw clean package -DskipTests

  # Restart just the backend container
  $DOCKER_COMPOSE up -d --build backend

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
$DOCKER_COMPOSE up -d --build

# Set the backend URL
BACKEND_URL="http://localhost:8080"

# Wait for the application to be ready
echo -e "${GREEN}Waiting for Spring Boot application to start...${NC}"
while ! curl -s $BACKEND_URL/users/register >/dev/null 2>&1; do
  echo "Waiting for application to become available..."
  sleep 5
done

echo -e "${GREEN}Spring Boot application is running!${NC}"

setup_bucket

echo -e "\n${GREEN}Setup complete! The application is running in Docker containers.${NC}"
echo -e "Access the application at http://localhost:8080"
echo -e "Access MinIO Console at http://localhost:9001 (login: minioadmin/minioadmin)"
echo -e "To stop all containers, run: ./setup.sh stop"
echo -e "To run unit tests, run: ./setup.sh test"
echo -e "To access the PostgreSQL console, run: ./setup.sh db"