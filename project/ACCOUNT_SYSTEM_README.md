# 👤 User Account System - Betify

A complete, feature-rich user account dashboard system with clean, modern UI inspired by real betting platforms.

## 🎯 Features

### Account Pages
- **Account Statement** - Financial ledger with date filters, type filters, and pagination
- **Bet History** - Historical bets with sport/match/date filtering
- **Unsettled Bets** - Real-time active bets display
- **Settings** - User profile and bet preferences management
- **Security** - Login history, session tracking, and device management

### User Menu System
- Global dropdown menu accessible from header
- Quick navigation to all account sections
- Secure logout functionality

## 📁 Project Structure

```
/app/account/
├── statement/          # Account statement page
├── bets/              # Bet history page
├── unsettled/         # Unsettled bets page
├── settings/          # Settings page
└── security/          # Security page

/app/api/account/
├── statement/route.js # Statement API
├── bets/route.js      # Bet history API
├── unsettled/route.js # Unsettled bets API
├── settings/route.js  # Settings API
└── security/route.js  # Security API
```

## 🎨 UI Design

### Style Guidelines (Option 1 - Clean Rounded)
- **Containers**: 10-14px border radius
- **Inputs**: 8px border radius
- **Buttons**: 8-10px border radius
- **Cards**: 12px border radius
- **Shadows**: Soft, subtle shadows
- **Spacing**: Clean, consistent spacing

### Color Scheme
- Primary: `#6366f1` (Indigo)
- Success: `#10b981` (Green)
- Danger: `#ef4444` (Red)
- Warning: `#f59e0b` (Amber)
- Background: `#0f172a` (Dark slate)
- Card Background: `#1e293b` (Slate)
- Text Primary: `#f8fafc` (White)
- Text Secondary: `#94a3b8` (Gray)

## 🔐 API Endpoints

### GET /api/account/statement
Query parameters:
- `fromDate` - Start date filter
- `toDate` - End date filter
- `filterType` - all/credit/debit
- `sport` - Sport filter
- `page` - Page number
- `limit` - Items per page

### GET /api/account/bets
Query parameters:
- `sport` - Sport filter
- `match` - Match search
- `date` - Date filter
- `page` - Page number
- `limit` - Items per page

### GET /api/account/unsettled
Returns active unsettled bets

### GET/PUT /api/account/settings
- GET: Returns user settings
- PUT: Updates user settings

### GET/POST /api/account/security
- GET: Returns login history
- POST: Actions (logout_all, change_password)

## 🛡️ Security Features

- Authentication required for all pages
- Input validation on all filters
- Secure password change with minimum 8 characters
- Session tracking and device management
- Logout from all devices functionality

## ⚡ Performance

- Pagination for large datasets
- Efficient filtering
- Mock data for development
- Ready for PostgreSQL/MongoDB/Redis integration

## 🚀 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Access account pages:
- http://localhost:3000/account/statement
- http://localhost:3000/account/bets
- http://localhost:3000/account/unsettled
- http://localhost:3000/account/settings
- http://localhost:3000/account/security

## 📊 Data Flow

```
PostgreSQL → ledger + transactions
MongoDB → bet logs + history
Redis → caching (ready for integration)
```

## 🎯 Future Enhancements

- [ ] Real PostgreSQL integration for ledger
- [ ] MongoDB integration for bet history
- [ ] Redis caching for performance
- [ ] Real-time WebSocket updates for unsettled bets
- [ ] Export statements to PDF/Excel
- [ ] Two-factor authentication
- [ ] Email verification
- [ ] Session timeout management

## 📝 License

MIT License - Betify Project