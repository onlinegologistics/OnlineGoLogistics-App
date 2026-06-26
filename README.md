# 🚚 OnlineGo Logistics — Mobile App & Backend

Welcome to the **OnlineGo Logistics** repository. This project contains the mobile application codebase along with its dedicated Node.js backend. The application is built using a modern, robust tech stack designed to deliver high performance, beautiful glassmorphic UI designs, and real-time shipment status synchronization.

---

## 📁 Repository Structure

```
OnlineGoLogistics-App/
├── backend/            # Express.js REST API server (runs on Port 5003)
│   ├── config/         # Database and server config setup
│   ├── controllers/    # API request handlers (Auth, Shipments, Complaints, etc.)
│   ├── models/         # Mongoose schema definitions
│   ├── routes/         # REST API route end-points
│   └── server.js       # Main server entry file
│
└── frontend/
    └── OnlineGoLogistics/ # Expo React Native Mobile Client Application
        ├── app/           # App routes and screens (Expo Router)
        ├── assets/        # App static assets (glowing headers, logo.jpg, truck illustrations)
        ├── src/
        │   ├── components/# Reusable dashboard components, custom cards
        │   ├── constants/ # Styling constants and DARK_GLASS_THEME variables
        │   └── screens/   # Interactive screens (User Dashboard, profile etc.)
        ├── api/           # Front-end API connectors (Axios)
        └── app.json       # Expo app configuration
```

---

## 🛠️ Tech Stack

### Backend
* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Database**: MongoDB Atlas (Shared Cluster with Web Branch Panel)
* **Authentication**: JWT (JSON Web Tokens) with Secure Storage validation
* **Body Parser Limit**: Increased to `50MB` to support Base64 profile photo uploads without triggering HTTP 413.

### Frontend (Mobile App)
* **Framework**: React Native with **Expo CLI** (Expo SDK 51+)
* **Navigation**: Expo Router (File-based routing) and React Navigation Drawer
* **Styling**: Vanilla React Native stylesheet tokens supporting a gorgeous **glassmorphism** design theme (e.g. glowing cards, translucent panels, and responsive grids).
* **State Management**: React state hooks coupled with AsyncStorage tokens.

---

## ⚡ Setup & Installation

### 1. Prerequisite Requirements
Ensure you have the following installed on your machine:
* **Node.js** (v18.x or higher)
* **npm** (v9.x or higher)
* **Expo Go** app installed on your physical mobile device (Android/iOS) to test locally, or an Emulator/Simulator configured.

---

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure your Environment variables. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5003
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signing_key
   ```
4. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *The backend will run on [http://localhost:5003](http://localhost:5003).*

---

### 3. Frontend Mobile Setup
1. Navigate to the mobile application directory:
   ```bash
   cd frontend/OnlineGoLogistics
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. **Run on Device / Emulator**:
   - Scan the QR code printed in the terminal using your phone camera (iOS) or the Expo Go App (Android).
   - Press `a` to run on an Android emulator or `i` to run on an iOS simulator.

---

## 🔑 Key Features Implemented

* **Real-time Status Notifications**: Immediate status changes made in the Web Branch Panel (Complaints, Enquiries, or Shipments) automatically generate and sync with the mobile dashboard as glowing green notification cards.
* **Modern Profile Management**: Interactive profile view featuring Base64 image uploads, instant name validation, and state persistence.
* **Onboarding Flow**: Clean redirection structure guiding users through the **Welcome Splash Screen** -> **Login Screen** -> **Register Screen** seamlessly.
* **Keyboard-Aware Scrollable Forms**: Custom scroll containers wrapped in `KeyboardAvoidingView` ensuring input fields are never hidden by the soft keyboard.
* **System Nav Optimization**: Safe area boundaries configured to prevent layout overlap with Android's system 3-button navigation bars.

---
*Created and maintained by OnlineGo Logistics Team.*
