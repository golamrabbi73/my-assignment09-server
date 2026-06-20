# 🚗 DriveFleet — Server Side

**Live API URL:** [https://my-assignment09-server.onrender.com](https://my-assignment09-server.onrender.com)

This is the backend server for **DriveFleet**, a full-stack car rental platform. It provides secure, JWT-protected REST APIs for managing cars, bookings, and users, backed by MongoDB.

---

## ✨ Key Features

- 🔐 **JWT Authentication with HTTPOnly Cookies** — secure token generation, storage, and verification middleware to protect private routes.
- 🚘 **Car Management API** — full CRUD support for car listings, with owner-based access control on update and delete.
- 📅 **Booking System** — create, fetch, and cancel bookings, with automatic `bookingCount` tracking using MongoDB's `$inc` operator.
- 🔍 **Search & Filter Support** — car search by name using MongoDB `$regex`, plus filtering by car type.
- 🛡️ **Ownership Verification** — sensitive routes (update/delete car, view/cancel booking) verify that the requester is the resource owner before allowing access.
- 🌐 **CORS-Configured for Production** — supports both local development and the deployed client domain.
- ❤️ **Health Check Endpoint** — `/health` route for uptime/status monitoring.

---

## 🛠️ Tech Stack

- Node.js + Express
- MongoDB (Native Driver)
- JSON Web Token (JWT)
- Cookie Parser
- CORS
- dotenv

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/jwt` | Public | Generate JWT and set as HTTPOnly cookie |
| POST | `/logout` | Public | Clear auth cookie |
| GET | `/cars` | Public | Get all cars (supports `search` & `carType` query) |
| POST | `/cars` | Private | Add a new car listing |
| GET | `/cars/:id` | Public | Get details of a single car |
| GET | `/my-cars` | Private | Get cars added by the logged-in user |
| PUT | `/cars/:id` | Private (owner only) | Update a car listing |
| DELETE | `/cars/:id` | Private (owner only) | Delete a car listing |
| GET | `/bookings` | Private | Get bookings for the logged-in user |
| POST | `/bookings` | Private | Create a new booking |
| PATCH | `/bookings/:id` | Private (owner only) | Cancel a booking |
| POST | `/users` | Public | Save/update user profile |
| GET | `/health` | Public | Server health check |

---

## 📂 Related Repositories

- **Server Repository:** [https://github.com/golamrabbi73/my-assignment09-server]
- **Client Repository:** [https://github.com/golamrabbi73/my-assignment09](https://github.com/golamrabbi73/my-assignment09)
- **Client Live URL:** [https://my-assignment09.vercel.app](https://my-assignment09.vercel.app)

---

## 🚀 Getting Started Locally

```bash
# clone the repository
git clone https://github.com/golamrabbi73/my-assignment09-server.git

# navigate into the project
cd my-assignment09-server

# install dependencies
npm install

# create a .env file with the required variables (see below)

# run the server
node server.js
```

### Required Environment Variables

```
MONGODB_URI=
PORT=5000
JWT_SECRET=
NODE_ENV=development
```

---

## 👤 Author

Built as part of a full-stack web development assignment — DriveFleet Car Rental Platform.