# Mauritanian Court Judgments Management System - Frontend

A React-based frontend for managing court judgments in Mauritania, featuring document extraction, validation workflows, and bilingual (Arabic/French) support.

## 🎨 Design System

The application uses Mauritanian national colors:

| Color | Hex | Usage |
|-------|-----|-------|
| Red | `#D01C1F` | Header, destructive actions, failed status |
| Green | `#00A95C` | Primary buttons, success, verified status |
| Gold | `#FFD700` | Warnings, highlights, needs_review status |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

## 📁 Project Structure

```
src/
├── api/                 # API client modules
│   ├── client.ts        # Axios instance with interceptors
│   ├── auth.ts          # Authentication endpoints
│   ├── batches.ts       # Batch upload endpoints
│   ├── judgments.ts     # Judgment CRUD endpoints
│   ├── validation.ts    # Validation workflow endpoints
│   ├── dataEntry.ts     # Data entry workflow endpoints
│   ├── courts.ts        # Court management endpoints
│   ├── users.ts         # User management endpoints
│   ├── dashboard.ts     # Dashboard statistics
│   └── files.ts         # File download endpoints
│
├── components/
│   ├── ui/              # Base UI components (shadcn/ui style)
│   ├── layout/          # App shell, header, sidebar
│   └── common/          # Shared components (badges, spinners)
│
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication state
│   ├── LanguageContext.tsx  # i18n state
│   └── SidebarContext.tsx   # Sidebar collapse state
│
├── hooks/               # Custom React hooks
│   └── usePermissions.ts    # Role-based permissions
│
├── lib/                 # Utilities and constants
│   ├── utils.ts         # Helper functions
│   ├── constants.ts     # App constants
│   └── types.ts         # TypeScript types
│
├── locales/             # Translation files
│   ├── ar/              # Arabic translations
│   └── fr/              # French translations
│
├── pages/               # Page components
│   ├── auth/            # Login page
│   └── dashboard/       # Dashboard page
│
├── App.tsx              # Main app with routing
├── main.tsx             # Entry point
├── i18n.ts              # i18n configuration
└── index.css            # Global styles
```

## 🔐 Authentication

The app uses JWT tokens stored in localStorage. Token is automatically attached to API requests via axios interceptors.

### Roles

| Role | Description |
|------|-------------|
| `admin` | Full access to all features |
| `validator` | Review and verify judgments |
| `data_entry` | Upload and edit failed extractions |
| `viewer` | Read-only access to verified judgments |

## 🌐 Internationalization

The app supports Arabic (RTL) and French (LTR). Language preference is stored in localStorage and affects:

- Document direction
- Font family
- All UI text

Toggle language via the header button or programmatically:

```tsx
const { language, toggleLanguage, setLanguage } = useLanguage()
```

## 📦 Build Phases

### Phase 1 - Foundation ✅
- [x] Project setup (Vite, Tailwind, shadcn)
- [x] Auth (login, JWT, protected routes)
- [x] App shell (header, sidebar, navigation)
- [x] i18n setup (AR/FR)
- [x] Dashboard with statistics

### Phase 2 - Batch Upload (Next)
- [ ] Batch list page
- [ ] Batch create + drag-drop upload
- [ ] Batch detail (file list, status)
- [ ] Processing trigger + progress

### Phase 3 - Data Entry
- [ ] Data entry queue
- [ ] Document preview (PDF/DOCX)
- [ ] Judgment edit form
- [ ] Submit for review

### Phase 4 - Validation
- [ ] Validation queue
- [ ] Side-by-side review
- [ ] Verify/reject/send-back
- [ ] Duplicate resolution

### Phase 5 - Browse & Admin
- [ ] Judgment search
- [ ] User management
- [ ] Court management
- [ ] Audit logs

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **State**: TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **i18n**: react-i18next
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📝 License

© Islamic Republic of Mauritania
