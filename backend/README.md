# API Endpoints

## Users

| Method | Endpoint                   | Request Body | Path Variable | Query Param | Description                     | Response                           |
|--------|----------------------------|--------------|---------------|-------------|---------------------------------|------------------------------------|
| POST   | `/users`                   | User object  | -             | -           | Creates a new user              | Created user object                |
| GET    | `/users/{userEmail}`       | -            | userEmail     | -           | Retrieves user by email         | User object                        |
| POST   | `/users/register`          | User object  | -             | -           | Initiates user registration     | Confirmation token                 |
| POST   | `/users/verify`            | User object  | -             | token       | Verifies email with token       | Created user object                |
| POST   | `/users/login`             | Login object | -             | -           | Authenticates a user            | Session ID and user object         |
| GET    | `/users/me`                | -            | -             | -           | Gets current user profile       | User object                        |
| DELETE | `/users/logout`            | -            | -             | -           | Terminates current session      | Confirmation message               |

## Sample Requests: User Registration

User registration begins when the client sends a registration request
1. A unique 6-character confirmation token is generated and emailed to the provided email for the user
2. A second request must be send from the user with a matching token. Note that currently, mail testing is done via a containerized mail server that can only be started locally
3. If the token matches, then a corresponding User will be created by the server and written to the database

### Sample Registration Process:

#### 1. Send registration request:
```json
curl --location 'http://localhost:8080/users/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    "userEmail": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "birthday": "2000-01-01"
}'
```

##### Expected output in Postman (note that this token will vary)
**`H0DV74`**

#### 2. The user will receive the token via their email, and the client should send the following request to confirm the user's email:
> **Note**: In this example, the verification token is **`H0DV74`**

```json
curl --location 'http://localhost:8080/users/verify?token=H0DV74' \
--header 'Content-Type: application/json' \
--data-raw '{
    "userEmail": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "birthday": "2000-01-01"
}'
```

##### Expected output in Postman:
```json
{
    "userEmail": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "birthday": "2000-01-01",
    "role": null,
    "biography": null,
    "year": null,
    "majors": null,
    "minors": null,
    "courses": null,
    "friends": null,
    "instructors": null,
    "availableTimes": null,
    "profilePicturePath": null
}
```

#### 3. You can verify the user's registration with a GET request on their email
```json
curl --location 'http://localhost:8080/users/test@example.com'
```

##### Expected output in Postman:
```json
{
    "userEmail": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "birthday": "2000-01-01",
    "role": null,
    "biography": null,
    "year": null,
    "majors": [],
    "minors": [],
    "courses": [],
    "friends": [],
    "instructors": [],
    "availableTimes": [],
    "profilePicturePath": null
}
```

# Sample Requests: User Login (Registration -> Login)

### 1. Register a New User

Start by creating a new user account:

```bash
curl -X POST http://localhost:8080/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "birthday": "1990-01-15",
    "role": "STUDENT"
  }'
```

**Expected Response:**
A verification token (e.g., `"ABC123"`) will be returned.

> **Note:** In a production environment, this token would be sent to the user's email address.

### 2. Verify the User Account

Complete the registration by verifying the account with the token:

```bash
curl -X POST "http://localhost:8080/users/verify?token=ABC123" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "birthday": "1990-01-15",
    "role": "STUDENT"
  }'
```

**Expected Response:**
A confirmation that the account has been verified.

### 3. Log In to the Account

Once verified, log in to obtain a session:

```bash
curl -X POST http://localhost:8080/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "sessionId": "a5c8f0e2-6b1d-4e31-9c7f-85c5640f0f89",
  "user": {
    "userEmail": "test@example.com",
    "name": "Test User",
    "...": "..."
  }
}
```

### 4. Access Protected Resources

Use the session ID to access protected endpoints:

```bash
curl -X GET http://localhost:8080/users/me \
  -H "Session-Id: a5c8f0e2-6b1d-4e31-9c7f-85c5640f0f89"
```

**Expected Response:**
Your user profile information.

### 5. Access Another User's Profile

With a valid session, you can also retrieve other user profiles:

```bash
curl -X GET http://localhost:8080/users/test@example.com \
  -H "Session-Id: a5c8f0e2-6b1d-4e31-9c7f-85c5640f0f89"
```

**Expected Response:**
The requested user's public profile information.

### 6. Log Out

End your session with a logout request:

```bash
curl -X DELETE http://localhost:8080/users/logout \
  -H "Session-Id: a5c8f0e2-6b1d-4e31-9c7f-85c5640f0f89"
```

**Expected Response:**
Confirmation that the session has been terminated.

### 7. Verify Session Invalidation

Confirm that the session is no longer valid:

```bash
curl -X GET http://localhost:8080/users/me \
  -H "Session-Id: a5c8f0e2-6b1d-4e31-9c7f-85c5640f0f89"
```

**Expected Response:**
An error message indicating the session is invalid or expired.