# Smart Municipal Service – Citizen Request Portal

A modern, bilingual municipal service portal built with React, TypeScript, and TanStack Router that allows citizens to report urban issues to city government.

## Features

- **Bilingual Support**: Full interface in Portuguese (PT-BR) and English (EN-US) with persistent language selection
- **Single Theme Toggle**: One-button theme switcher that indicates the action (switch to dark/light) instead of the current state
- **Language Dropdown**: Clean dropdown selector instead of separate buttons for language selection
- **Flexible Location Input**: Report issues using postal code (CEP) or interactive map marker
- **ViaCEP Integration**: Automatic address lookup with manual fallback when CEP is entered
- **Form Validation**: Comprehensive client-side validation with Zod
- **Clean Architecture**: SOLID principles with clear separation of concerns
- **Responsive Design**: Mobile-first design that works on all devices
- **Accessible**: WCAG AA compliant color contrasts and keyboard navigation support

## Technology Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Router** - Type-safe routing
- **TanStack Form** - Form state management
- **Zod** - Runtime validation
- **Axios** - HTTP client
- **react-leaflet** - Interactive maps
- **Tailwind CSS** - Utility-first styling
- **Phosphor Icons** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Architecture

This project follows a clean, idiomatic architecture with clear separation of concerns:

```
src/
├── features/              # Feature-specific modules
│   └── requests/
│       ├── components/    # Feature UI components (RequestForm, MapPicker, etc.)
│       ├── hooks/         # Feature-specific hooks (useSubmitRequest)
│       ├── services/      # API integration layer (requestsService)
│       ├── types/         # Domain types and interfaces
│       └── validators/    # Zod schemas for validation
│
├── pages/                 # Route-level page components
│   ├── HomePage.tsx       # Landing page with form
│   └── ConfirmationPage.tsx  # Post-submission confirmation
│
├── router/                # TanStack Router configuration
│   └── index.tsx          # Route definitions
│
└── shared/                # Shared/reusable code
    ├── components/        # Global UI components (LanguageSwitcher, ThemeSwitcher)
    ├── i18n/              # Internationalization
    │   ├── translations.ts   # Translation dictionaries
    │   └── useI18n.tsx       # i18n Context and hook
    ├── lib/               # Utilities and configurations
    │   └── axios.ts       # Axios client setup
    ├── theme/             # Theme management
    │   └── useTheme.tsx   # Theme Context and hook
    └── ui/                # Design system components
        ├── Alert.tsx      # Alert component with variants
        ├── Button.tsx     # Button with loading states
        ├── Card.tsx       # Container component
        └── Field.tsx      # Form field wrapper
```

### Architecture Principles

#### 1. **Layered Architecture**
- **Pages**: Route-level components focused on composition and layout
- **Features**: Domain-specific business logic and UI
- **Shared**: Reusable infrastructure (UI kit, i18n, theme)

#### 2. **Separation of Concerns**
- **Services** handle HTTP communication
- **Hooks** orchestrate stateful logic
- **Components** focus on presentation
- **Validators** define data contracts

#### 3. **Dependency Inversion**
- Feature components depend on service abstractions (easy to mock/test)
- UI components are generic and business-logic agnostic

#### 4. **Single Responsibility**
- Each module has one clear purpose
- Small, focused components and functions

## Internationalization (i18n)

The application uses a custom i18n solution with:

- **Context Provider**: `I18nProvider` wraps the app
- **Hook**: `useI18n()` provides `{ lang, setLang, t }`
- **Translation Function**: `t(key)` retrieves nested translation strings
- **Persistence**: Language preference saved to localStorage
- **Default**: Portuguese (pt-BR)

All UI strings are externalized to `src/shared/i18n/translations.ts`.

## Theme Management

The application supports light and dark themes:

- **Context Provider**: `ThemeProvider` wraps the app  
- **Hook**: `useTheme()` provides `{ theme, setTheme, toggleTheme }`
- **Implementation**: Tailwind CSS class strategy (`dark` class on root)
- **Persistence**: Theme preference saved to localStorage
- **Default**: Light mode
- **UI**: Single toggle button that shows the action (e.g., "Dark" when in light mode to indicate switching to dark)

## Language Selection

Language selection has been updated for better UX:

- **Dropdown Selector**: Clean `<select>` dropdown instead of separate buttons
- **Options**: "Português (Brasil)" and "English (US)"
- **Persistence**: Language preference saved to localStorage
- **Default**: Portuguese (pt-BR)
- **Accessible**: Proper ARIA labels and visible label support

## Address Input and ViaCEP Integration

When using CEP mode, the form now provides comprehensive address capture:

- **Auto-fill**: When a valid 8-digit CEP is entered, the form automatically lookups the address using the ViaCEP API
- **Loading State**: Visual feedback (spinner + message) while looking up the address
- **Auto-populate**: Street, neighborhood, city, and state fields are automatically filled when found
- **Manual Fallback**: If ViaCEP fails or returns no data, users can manually fill all address fields
- **Error Handling**: Friendly error messages guide users to complete the form manually if lookup fails
- **Required Fields**: When in CEP mode, the form requires: CEP, street, number, neighborhood, city, and state
- **Optional Fields**: Complement and reference point are optional
- **Network Resilience**: Form submission never blocks due to ViaCEP failures - manual input is always allowed

## Form Validation

Forms use TanStack Form with Zod validation:

- **Location-aware validation**: Different rules for CEP vs Map modes
- **Translated error messages**: All validation errors support both languages
- **Real-time feedback**: Errors displayed as user types
- **CEP normalization**: Strips formatting before submission

## API Integration

The `requestsService` includes:

- **Simulated latency** (800-1200ms) for realistic loading states
- **Mock fallback**: If API unavailable, creates mock response
- **Error handling**: Service layer catches errors, hook manages error state

## State Management Strategy

- **TanStack Form**: Form state
- **React Context**: Global concerns (language, theme)
- **Local State**: Component-specific UI state
- **No global state library**: Keeps architecture simple

## Color Palette

### Light Mode
- **Primary**: Civic Blue `oklch(0.45 0.15 250)` - Authority and reliability
- **Accent**: Warm Orange `oklch(0.65 0.18 45)` - CTAs and highlights
- **Background**: Near-white `oklch(0.98 0 0)`
- **Foreground**: Dark blue-gray `oklch(0.20 0.02 250)`

### Dark Mode
- **Primary**: Brighter Blue `oklch(0.55 0.18 250)`
- **Accent**: Brighter Orange `oklch(0.70 0.20 45)`
- **Background**: Dark blue `oklch(0.12 0.02 250)`
- **Foreground**: Off-white `oklch(0.95 0 0)`

All color pairings meet WCAG AA contrast requirements (4.5:1 for text, 3:1 for large text).

## Design System

The app includes a minimal custom UI kit:

- **Button**: Variants (primary, secondary, ghost), sizes (sm, md), loading state support
- **Card**: Optional header slot, consistent padding and borders
- **Alert**: Variants (success, error, info, warning) with icons
- **Field**: Label + input wrapper with error/helper text display

All components use CVA (class-variance-authority) for variant management.

## Map Integration

Uses react-leaflet with OpenStreetMap tiles and enhanced features:

### Geolocation Auto-Centering
- On first render, attempts to retrieve user's location using browser geolocation API
- If permission granted: centers map to user coordinates (zoom level 15)
- If permission denied or unavailable: falls back to Rio de Janeiro City Hall coordinates (-22.9068, -43.1729)
- Displays subtle notification when fallback is used

### Address Search (Geocoding)
- Search input above map allows users to find addresses
- Uses Nominatim API (`https://nominatim.openstreetmap.org/search`)
- Debounced search (500ms) to prevent excessive API calls
- Features:
  - Real-time loading indicator
  - Smooth map animation (flyTo) when address found
  - Automatic marker placement at search result
  - Form state updates with coordinates
  - Friendly error messages when address not found
  - User can continue with manual marker placement after search

### Interactive Map Features
- **Click to place marker**: Click anywhere on map to set location
- **Draggable markers**: Drag existing marker to adjust position
- **Smooth transitions**: Map smoothly animates when centering or searching
- **Responsive sizing**: 300px (mobile), 400px (desktop)
- **State persistence**: Coordinates persist when switching between CEP/Map modes

### Rate Limiting & Best Practices
**Important for Production:**
- Nominatim has usage limits and requires respectful use
- Current implementation calls API directly from client
- **Recommended for production:**
  - Implement backend proxy endpoint
  - Add request caching (IP-based or general)
  - Implement rate limiting
  - Add User-Agent header identifying your application
  - Consider alternative geocoding services for high-traffic scenarios

### Map Constants
Default coordinates stored in `src/shared/constants/mapDefaults.ts`:
- Rio de Janeiro City Hall: -22.9068, -43.1729 (zoom: 15)
- Default search zoom: 16

## Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features required

## License

MIT

## Contributing

This is a proof-of-concept application. For production use, consider:

- Connecting to real municipal API endpoints
- Adding user authentication
- Implementing request tracking
- Adding analytics and monitoring
- Comprehensive test coverage
- Accessibility audit
