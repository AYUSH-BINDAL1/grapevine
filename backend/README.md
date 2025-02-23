# API Endpoints

## Users

| Method | Endpoint         | Request Body | Path Variable | Description                    | Response                |
|--------|-----------------|--------------|---------------|--------------------------------|------------------------|
| POST   | `/users`        | User object  | -             | Creates a new user            | Created user object    |
| GET    | `/users/{userEmail}` | -            | userEmail     | Retrieves user by email | User object           |

### Sample Requests
#### Create User
```json
curl -X POST 'http://localhost:8080/users' \
-H 'Content-Type: application/json' \
-d '{
"userEmail": "test@example.com",
"password": "password123",
"name": "Test User",
"birthday": "2000-01-01",
"role": "STUDENT"
}
```
#### Get User
```json
curl --location 'http://localhost:8080/users/test@example.com'
`