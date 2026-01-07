# Authentication Module

**Developer 1 Responsibility**

Handles user registration, login, password reset, and email verification.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `GET /api/auth/verify-email/:token`

## Models

- `User`
- `UniqueID`
- `RegistrationSession`
