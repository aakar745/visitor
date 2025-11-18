# 🎪 Visitor Registration Frontend

> **Public-facing visitor registration system built with Next.js 16, ShadCN UI, and TypeScript**

---

## 📋 Overview

This is the visitor-facing frontend application for exhibition and event registration. It provides a modern, accessible, and SEO-optimized interface for visitors to browse exhibitions, register for events, and manage their registrations.

---

## 🚀 Tech Stack

- **Framework**: Next.js 16.0.1 (App Router, Turbopack)
- **UI Library**: ShadCN UI + Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Form Management**: React Hook Form + Zod validation
- **State Management**: Zustand
- **API Client**: Axios with Tanstack Query
- **Language**: TypeScript
- **Toast Notifications**: Sonner
- **Package Manager**: npm

---

## 🛠️ Installation

### Prerequisites

- Node.js 18+ or 20+
- npm, yarn, pnpm, or bun

### Steps

1. **Clone the repository** (if not already done)

2. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Setup environment variables**
   ```bash
   # Copy example environment file
   cp env.example.txt .env.local
   
   # Update .env.local with your backend API URL
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   - Visit: `http://localhost:3001`

---

## 📁 Environment Configuration

### Development (`.env.local`)

```env
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=Visitor Registration
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENV=development

# Port (to avoid conflict with backend on 3000)
PORT=3001
```

### Production (`.env.production`)

See `env.production.txt` for production configuration template.

**Important:** Update `NEXT_PUBLIC_API_BASE_URL` to your production backend URL.

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── [exhibitionSlug]/    # Exhibition detail page (SSR)
│   │   ├── success/              # Registration success page (CSR)
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page (SSR)
│   ├── components/
│   │   ├── exhibition/           # Exhibition display components
│   │   ├── forms/                # Form sections
│   │   ├── providers/            # Context providers
│   │   ├── shared/               # Shared components
│   │   └── ui/                   # ShadCN UI components
│   ├── lib/
│   │   ├── api/                  # API client & services
│   │   ├── hooks/                # Custom React hooks
│   │   ├── store/                # Zustand stores
│   │   ├── validation/           # Zod schemas
│   │   ├── constants.ts          # App constants
│   │   └── utils.ts              # Utility functions
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── public/                       # Static assets
├── env.example.txt               # Environment template (development)
├── env.production.txt            # Environment template (production)
└── package.json                  # Dependencies & scripts
```

---

## 🎨 Features

### ✅ Core Features
- 🏠 **Exhibition Listing** - Browse active exhibitions (SSR for SEO)
- 📝 **Registration Form** - Multi-step form with validation
- 🔗 **Exhibitor Referral Links** - Pre-filled forms via exhibitor URLs
- 💾 **Auto-save** - Form data persists in localStorage
- 👤 **Returning Visitor Recognition** - Auto-fill for known visitors
- 🎫 **QR Code Generation** - Digital badges after registration
- 📱 **Responsive Design** - Mobile-first, fully responsive
- ♿ **Accessibility** - WCAG 2.1 compliant

### 🎯 Form Sections
1. **Personal Information** - Name, email, phone, company, designation
2. **Address** - State, city, pincode, full address
3. **Interests** - Selectable interest categories
4. **Registration Category** - Visitor type selection
5. **Pricing Tiers** - Dynamic pricing (for paid exhibitions)
6. **Custom Fields** - Exhibition-specific additional fields

### 🔒 Data Management
- **Client-side validation** with Zod schemas
- **Server-side validation** via backend API
- **Real-time feedback** on form errors
- **Auto-save** with debouncing (1s delay)
- **Draft restoration** on page reload

---

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start dev server on http://localhost:3001

# Production
npm run build        # Build production bundle
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

## 🔗 API Integration

### Backend Endpoints Used

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/exhibitions` | GET | ❌ Public | List active exhibitions |
| `/exhibitions/by-slug/:slug` | GET | ❌ Public | Get exhibition details |
| `/exhibitions/:id/exhibitors/by-slug/:slug` | GET | ❌ Public | Get exhibitor by slug |
| `/registrations` | POST | ❌ Public | Create registration |
| `/registrations/verify/:id` | GET | ❌ Public | Get registration details |
| `/registrations/lookup?email=xxx` | GET | ❌ Public | Lookup visitor by email |
| `/locations/states` | GET | ❌ Public | Get Indian states list |
| `/locations/cities?state=xxx` | GET | ❌ Public | Get cities for state |

### Error Handling

- **Network errors** - User-friendly offline messages
- **400 errors** - Display validation errors
- **404 errors** - Redirect to not-found page
- **500 errors** - Generic error message

---

## 🌐 SEO & Performance

### Server-Side Rendering (SSR)
- ✅ Home page (Exhibition listing)
- ✅ Exhibition detail pages
- ✅ Dynamic metadata generation
- ✅ Open Graph tags

### Client-Side Rendering (CSR)
- Forms (for better interactivity)
- Success page (post-registration)

### Performance
- **Turbopack** for faster builds
- **Image optimization** with Next.js Image
- **Code splitting** automatic
- **Dynamic imports** for heavy components

---

## 🎨 UI Components

Built with **ShadCN UI** (Radix UI + Tailwind CSS):

- Accordion
- Alert
- Badge
- Button
- Card
- Checkbox
- Dialog
- Dropdown Menu
- Form
- Input
- Label
- Radio Group
- Select
- Separator
- Skeleton
- Tabs
- Textarea
- Toast (Sonner)

---

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `components.json` | ShadCN UI configuration |
| `postcss.config.mjs` | PostCSS configuration |
| `eslint.config.mjs` | ESLint configuration |

---

## 🚨 Port Configuration

**Frontend Port:** `3001`  
**Backend Port:** `3000`  
**Admin Port:** `5173`

See `PORT_CONFIGURATION.md` for details.

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### API Connection Issues
1. Ensure backend is running on port 3000
2. Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Verify CORS configuration in backend

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

---

## 📄 License

Proprietary - All rights reserved

---

## 👨‍💻 Development Team

For questions or support, contact the development team.

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [ShadCN UI Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Tanstack Query](https://tanstack.com/query/latest)

---

**Built with ❤️ for seamless visitor registration**
