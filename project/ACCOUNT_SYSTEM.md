# Betify - User Account System

## 📋 Overview
Complete user account dashboard system with financial tracking, bet history, and security controls.

## 🏗️ Architecture

### Pages Structure
```
/app/account/
├── statement/     - Account statement with ledger view
├── bets/          - Bet history
├── unsettled/     - Active/unsettled bets
├── settings/      - User settings & preferences
└── security/      - Security & session management
```

### API Endpoints
```
/api/account/
├── statement/     - GET: Fetch ledger data
├── bets/          - GET: Fetch bet history
├── unsettled/     - GET: Fetch active bets
├── settings/      - POST: Update settings
└── security/      - GET/POST: Session management
```

## 🎨 UI Features
- Clean rounded design (10-14px radius)
- User dropdown menu
- Responsive tables
- Date range filters
- Real-time balance tracking

## 🔐 Security
- Cookie-based authentication
- Session management
- Logout all devices feature
- Login history tracking

## 📊 Data Flow
- PostgreSQL → Ledger & transactions
- API routes → Data endpoints
- Client-side → React components

## 🚀 Getting Started
```bash
npm install
npm run dev
```

## 📝 Pages

### Account Statement
- Date filter (from/to)
- Transaction type filter
- Ledger table with pagination

### Bet History
- Sport filter
- Date filter
- Win/Loss tracking

### Unsettled Bets
- Real-time updates
- Current odds display
- Pending status

### Settings
- Password change
- Profile updates
- Bet preferences

### Security
- Login history
- Session tracking
- Logout all devices