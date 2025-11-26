# 📁 Project Structure

```
web-check-in-theo-doi-thoi-gian-online/
│
├── public/
│   ├── models/              # Face detection AI models
│   │   ├── tiny_face_detector_model-*
│   │   ├── face_landmark_68_model-*
│   │   ├── face_recognition_model-*
│   │   └── ssd_mobilenetv1_model-*
│   └── vite.svg
│
├── src/
│   ├── components/
│   │   ├── icons/
│   │   │   └── index.tsx            # Custom SVG icons (no library)
│   │   ├── layout/
│   │   │   └── Navbar.tsx           # Main navigation bar
│   │   ├── staff/
│   │   │   ├── CheckInButton.tsx    # Face recognition check-in
│   │   │   ├── CaptchaModal.tsx     # CAPTCHA verification modal
│   │   │   └── BackSoonModal.tsx    # Back soon reason selector
│   │   └── ui/
│   │       ├── Button.tsx           # Reusable button component
│   │       ├── Card.tsx             # Card component with glassmorphism
│   │       ├── Input.tsx            # Input with validation
│   │       ├── Modal.tsx            # Modal with animations
│   │       ├── StatusBadge.tsx      # Status indicator
│   │       ├── LoadingSpinner.tsx   # Loading states
│   │       └── index.ts             # Barrel export
│   │
│   ├── config/
│   │   └── firebase.ts              # Firebase initialization
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx            # Authentication page
│   │   ├── StaffDashboard.tsx       # Staff main dashboard
│   │   ├── AdminDashboard.tsx       # Admin control panel
│   │   ├── HistoryPage.tsx          # Activity history
│   │   └── CameraPage.tsx           # Camera & image management
│   │
│   ├── services/
│   │   ├── auth.ts                  # Authentication service
│   │   └── activityLog.ts           # Activity logging service
│   │
│   ├── store/
│   │   ├── authStore.ts             # Auth state (Zustand)
│   │   └── sessionStore.ts          # Session state (Zustand)
│   │
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces & types
│   │
│   ├── utils/
│   │   ├── captcha.ts               # CAPTCHA generation
│   │   ├── faceRecognition.ts       # Face detection & comparison
│   │   ├── sound.ts                 # Sound notification manager
│   │   └── time.ts                  # Time formatting utilities
│   │
│   ├── App.tsx                      # Main app with routing
│   ├── main.tsx                     # App entry point
│   └── index.css                    # Global styles with Tailwind
│
├── .env.example                     # Environment variables template
├── .eslintrc.cjs                    # ESLint configuration
├── .gitignore                       # Git ignore rules
├── CHANGELOG.md                     # Version history
├── FEATURES.md                      # Detailed features list
├── FIREBASE_SETUP.md                # Firebase schema & setup
├── LICENSE                          # MIT License
├── package.json                     # Dependencies & scripts
├── postcss.config.js                # PostCSS configuration
├── README.md                        # Main documentation
├── SETUP_GUIDE.md                   # Installation guide
├── tailwind.config.js               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.node.json               # TypeScript node configuration
└── vite.config.ts                   # Vite build configuration
```

## 📊 Statistics

### Components Breakdown
- **UI Components**: 7
- **Layout Components**: 1
- **Feature Components**: 3
- **Pages**: 5
- **Icons**: 20+ (all custom SVG)

### Code Organization

#### `/src/components/`
Reusable UI and feature components organized by purpose:
- `icons/`: Custom SVG icons, no external libraries
- `layout/`: Layout components (Navbar, Sidebar, etc.)
- `staff/`: Staff-specific features (Check-in, CAPTCHA, etc.)
- `ui/`: Generic reusable UI components

#### `/src/config/`
Configuration files:
- Firebase initialization
- App constants

#### `/src/pages/`
Page-level components corresponding to routes:
- Login page with animations
- Staff dashboard with real-time tracking
- Admin dashboard with user management
- History page with filtering
- Camera page with image management

#### `/src/services/`
Business logic and API calls:
- Authentication service (sign in, sign out, create user)
- Activity logging (comprehensive audit trail)

#### `/src/store/`
State management with Zustand:
- Auth store: User authentication state
- Session store: Current session tracking

#### `/src/types/`
TypeScript type definitions:
- User types
- Session types
- Activity log types
- All interfaces centralized

#### `/src/utils/`
Utility functions:
- CAPTCHA generation with canvas
- Face recognition using TensorFlow.js
- Sound notification manager
- Time formatting and calculations

## 🎨 Design Patterns

### Component Architecture
```
Page Components (Route-level)
    ↓
Feature Components (Staff-specific, Admin-specific)
    ↓
UI Components (Reusable, Generic)
    ↓
Base HTML Elements
```

### State Management
```
Zustand Stores (Global State)
    ↓
React Component State (Local State)
    ↓
Props (Component Communication)
```

### Data Flow
```
Firebase (Backend)
    ↓
Services (API Layer)
    ↓
Zustand Stores (State Layer)
    ↓
React Components (UI Layer)
    ↓
User Interactions
```

## 🔧 Configuration Files

### Build & Development
- `vite.config.ts`: Vite build configuration with React plugin
- `tsconfig.json`: TypeScript compiler options
- `tailwind.config.js`: Tailwind CSS customization
- `postcss.config.js`: PostCSS with Tailwind & Autoprefixer

### Code Quality
- `.eslintrc.cjs`: ESLint rules for TypeScript & React
- `tsconfig.json`: Strict TypeScript configuration

### Environment
- `.env.example`: Template for environment variables
- `.gitignore`: Git ignore patterns

## 📦 Key Dependencies

### Production Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.22.0",
  "firebase": "^10.8.0",
  "framer-motion": "^11.0.5",
  "@tensorflow/tfjs": "^4.17.0",
  "face-api.js": "^0.22.2",
  "zustand": "^4.5.0",
  "react-hot-toast": "^2.4.1",
  "date-fns": "^3.3.1"
}
```

### Development Dependencies
```json
{
  "@vitejs/plugin-react-swc": "^3.6.0",
  "typescript": "^5.3.3",
  "tailwindcss": "^3.4.1",
  "eslint": "^8.56.0"
}
```

## 📝 File Naming Conventions

- **Components**: PascalCase (e.g., `Button.tsx`, `StaffDashboard.tsx`)
- **Utilities**: camelCase (e.g., `captcha.ts`, `faceRecognition.ts`)
- **Stores**: camelCase with "Store" suffix (e.g., `authStore.ts`)
- **Types**: Single `index.ts` for centralized types
- **Services**: camelCase (e.g., `auth.ts`, `activityLog.ts`)

## 🎯 Import Aliases

Configured path aliases in `tsconfig.json`:
```typescript
"@/*": ["./src/*"]
```

Usage example:
```typescript
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { formatTime } from '@/utils/time';
```

## 🚀 Build Output

After running `npm run build`, the `dist/` folder contains:
```
dist/
├── assets/
│   ├── index-[hash].js       # Main JavaScript bundle
│   ├── index-[hash].css      # Compiled CSS
│   └── [other-assets]
├── models/                    # Face detection models
└── index.html                # Entry HTML
```

---

**Total Files**: 50+
**Total Lines of Code**: ~8,000+
**Bundle Size**: ~500KB (gzipped)

