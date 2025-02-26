# API Endpoints

## Users

| Method | Endpoint                   | Request Body | Path Variable | Query Param | Description                     | Response                 |
|--------|----------------------------|--------------|---------------|-------------|---------------------------------|--------------------------|
| POST   | `/users`                   | User object  | -             | -           | Creates a new user              | Created user object      |
| GET    | `/users/{userEmail}`       | -            | userEmail     | -           | Retrieves user by email         | User object              |
| POST   | `/users/register`          | User object  | -             | -           | Initiates user registration     | Confirmation token       |
| GET    | `/users/verify`            | User object  | -             | token       | Verifies email with token       | Created user object      |

## User Registration

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
**H0DV74**

#### 2. The user will receive the token via their email, and the client should send the following request to confirm the user's email:
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

### Sample Requests

#### Create User

```json
curl --location 'http://localhost:8080/users' \
--header 'Content-Type: application/json' \
--data-raw '{
  "userEmail": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "birthday": "2000-01-01",
  "role": "STUDENT"
}'
```

##### Expected Response:

```json
{
  "userEmail": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "birthday": "2000-01-01",
  "role": "STUDENT",
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

#### Get User

```json
curl --location 'http://localhost:8080/users/test@example.com'
```

##### Expected Response:

```json
{
  "userEmail": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "birthday": "2000-01-01",
  "role": "STUDENT",
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