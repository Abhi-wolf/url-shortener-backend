# Short URL Service

A URL shortening service with user authentication, analytics, rate limiting, and caching features.

## Features

- User registration and login
- JWT-based authentication
- URL shortening
- URL analytics
- Rate limiting
- Redis caching

## Tech Stack

- Node.js
- Express
- Redis
- JWT for authentication
- Rate limiting middleware
- Mongodb for database
  
## Getting Started

### Prerequisites

- Node.js
- npm
- Mongodb
- Redis

### Installation

1. Clone the repository:
    ```bash
    https://github.com/Abhi-wolf/url-shortener-backend.git
    cd url-shortener-backend
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables. Create a `.env` file in the root directory and add the following variables:
    ```env
    PORT=5001
    CONNECTION_STRING=
    ACCESS_TOKEN_SECRET=
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=
    REFRESH_TOKEN_EXPIRY=10d
    CORS_ORIGIN=*
    REDIS_URL=
    REDIS_PORT=
    RATE_LIMIT=20
    EXPIRY_TIME_RATE_LIMIT=60
    URL=/api/v1/urls
    ```

4. Start the server:
    ```bash
    npm start
    ```
