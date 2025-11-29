# Kayak Vending Machine

This project is a fully autonomous kayak vending machine system that allows users to log in, sign waivers, rent kayaks, and receive passcodes for access. The application is divided into a backend and a frontend, with the backend handling API requests and the frontend providing a user interface.

## Features

- User authentication (login/signup)
- Waiver signing and storage
- Kayak rental management
- Passcode generation for kayak access via TTLock
- Email notifications for rentals

## Project Structure

```
kayak-vending-machine
├── backend
│   ├── src
│   │   ├── index.ts
│   │   ├── config
│   │   │   └── db.ts
│   │   ├── controllers
│   │   │   ├── authController.ts
│   │   │   ├── waiverController.ts
│   │   │   └── rentalController.ts
│   │   ├── routes
│   │   │   └── index.ts
│   │   ├── models
│   │   │   ├── user.ts
│   │   │   ├── waiver.ts
│   │   │   └── rental.ts
│   │   ├── services
│   │   │   ├── ttlockService.ts
│   │   │   ├── emailService.ts
│   │   │   └── paymentService.ts
│   │   └── utils
│   │       └── validators.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend
│   ├── src
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── pages
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── Waiver.tsx
│   │   │   ├── Rent.tsx
│   │   │   └── Passcode.tsx
│   │   ├── components
│   │   │   ├── Navbar.tsx
│   │   │   ├── KayakCard.tsx
│   │   │   └── SignaturePad.tsx
│   │   └── types
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── infra
│   ├── docker-compose.yml
│   └── Dockerfile
├── scripts
│   └── seed.ts
├── .env.example
├── README.md
└── LICENSE
```

## Getting Started

### Prerequisites

- Node.js
- TypeScript
- Docker (for containerization)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd kayak-vending-machine
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. Start the frontend application:
   ```
   cd frontend
   npm start
   ```

3. Access the application at `http://localhost:3000`.

### Usage

- Users can sign up and log in to the application.
- After logging in, users can sign waivers and rent kayaks.
- Upon successful rental, users will receive a passcode for kayak access.

## License

This project is licensed under the MIT License. See the LICENSE file for details.