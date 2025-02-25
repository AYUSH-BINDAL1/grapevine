# API Endpoints

## Users

| Method | Endpoint             | Request Body | Path Variable | Description             | Response             |
|--------|----------------------|--------------|---------------|-------------------------|----------------------|
| POST   | `/users`             | User object  | -             | Creates a new user      | Created user object  |
| GET    | `/users/{userEmail}` | -            | userEmail     | Retrieves user by email | User object          |

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
