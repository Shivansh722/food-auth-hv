# Food Authentication System

A clean, minimal React webapp for office food authentication using camera-based face recognition. This system replaces QR code scanning with modern face authentication technology.

## 🚀 Features

- **📸 Camera Authentication**: WebRTC-based camera capture for face recognition
- **👨‍💼 Admin Dashboard**: Real-time user management and food consumption logs
- **🔥 Firebase Integration**: Real-time data sync with Firestore (no billing required)
- **📱 Responsive Design**: Clean, modern UI that works on desktop and mobile
- **⚡ Real-time Updates**: Instant logging and viewing of food consumption data

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router
- **Backend**: Firebase (Firestore, Authentication)
- **Styling**: Pure CSS with modern gradients
- **Camera**: WebRTC getUserMedia API

## 📦 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
- Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
- Enable **Firestore Database** (start in test mode)
- Enable **Authentication** (optional for admin features)
- Add a web app and copy the config
- Update `src/firebase/config.js` with your Firebase configuration

### 3. Run the Application
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🎯 Usage

### User Authentication
1. Navigate to the main page
2. Click "Start Camera" and allow camera access
3. Position face in camera view
4. Click "Authenticate & Log Food" to log consumption

### Admin Dashboard
1. Click "Admin" button on main page
2. Add new users with email and name
3. View real-time food consumption logs
4. Monitor authentication status

## 🔧 Project Structure

```
src/
├── components/
│   ├── AuthPage.js          # Main authentication interface
│   └── AdminDashboard.js    # Admin management panel
├── firebase/
│   └── config.js           # Firebase configuration
├── App.js                  # Main app component with routing
└── index.js               # App entry point
```

## 🚧 Integration Points

The app is designed for easy integration with your company's systems:

- **Face Recognition SDK**: Replace mock authentication in `capturePhoto()` function
- **Face Enrollment API**: Add enrollment functionality to admin dashboard
- **User Management**: Extend with real user data from face recognition

## 📝 Development Notes

- Images are stored as base64 strings in Firestore (no Firebase Storage required)
- Camera permissions are handled gracefully with error messages
- Real-time updates using Firebase Firestore listeners
- Clean, minimal codebase with no unnecessary dependencies

## 🔮 Future Enhancements

- [ ] Integrate company face recognition SDK
- [ ] Add face enrollment for new users
- [ ] Implement user authentication with company email
- [ ] Add data export functionality
- [ ] Implement user role management
