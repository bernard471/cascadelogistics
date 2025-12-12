# Database Schema & API Documentation

## 📋 Overview
This document outlines all MongoDB schemas, TypeScript types, and API routes created for the User Dashboard functionality.

---

## 🗄️ Database Collections

### 1. **users** (Already exists)
- Stores user authentication and profile data
- Fields: firstName, lastName, email, username, password, role, status, etc.

### 2. **shipments**
- Stores all shipment/asset data
- Primary collection for tracking packages

### 3. **notifications**
- Stores user notifications
- Linked to users and optionally to shipments

### 4. **support_tickets**
- Stores customer support requests
- Linked to users and optionally to shipments

---

## 📦 Models/Types Created

### `src/models/Shipment.ts`
```typescript
- Shipment interface
- ShipmentWithUser interface (for admin views)
- Status types: pending, in-transit, delivered, cancelled, on-hold
- Service types: standard, express, overnight, economy
- Package types: document, parcel, package, fragile, electronics, other
```

### `src/models/Notification.ts`
```typescript
- Notification interface
- NotificationFilter type
- Types: delivery, update, alert, pending, payment, system
```

### `src/models/SupportTicket.ts`
```typescript
- SupportTicket interface
- Priority levels: low, medium, high, urgent
- Status types: open, in-progress, resolved, closed
- Categories: shipment, billing, account, technical, general
```

---

## 🔌 API Routes Created

### **Shipments API**

#### `POST /api/shipments`
- Create new shipment
- Auto-generates tracking ID (NSC######)
- Returns: shipmentId, trackingId

#### `GET /api/shipments`
- Get all user's shipments
- Query params: status, limit, skip
- Returns: shipments[], total, page, totalPages

#### `GET /api/shipments/[id]`
- Get single shipment by ID
- Protected: user can only access their own

#### `PUT /api/shipments/[id]`
- Update shipment
- Protected: user can only update their own

#### `DELETE /api/shipments/[id]`
- Delete shipment
- Protected: user can only delete their own

#### `GET /api/shipments/track/[trackingId]`
- Track shipment by tracking ID
- Public endpoint (limited data)
- Returns: status, timeline, location, etc.

---

### **Notifications API**

#### `POST /api/notifications`
- Create new notification
- Auto-sets isRead: false

#### `GET /api/notifications`
- Get all user's notifications
- Query params: filter (all|read|unread), limit
- Returns: notifications[], total, unreadCount

#### `PATCH /api/notifications/[id]`
- Mark notification as read/unread
- Updates readAt timestamp

#### `DELETE /api/notifications/[id]`
- Delete notification

#### `POST /api/notifications/mark-all-read`
- Mark all user's notifications as read
- Returns: modifiedCount

---

### **Support Tickets API**

#### `POST /api/support-tickets`
- Create new support ticket
- Auto-generates ticket number (TKT######)
- Returns: ticketId, ticketNumber

#### `GET /api/support-tickets`
- Get all user's tickets
- Query params: status, limit
- Returns: tickets[], total

#### `GET /api/support-tickets/[id]`
- Get single ticket by ID

#### `PATCH /api/support-tickets/[id]`
- Update ticket or add response
- Can update: status, priority, add response

#### `DELETE /api/support-tickets/[id]`
- Delete ticket

---

### **User Stats API**

#### `GET /api/user/stats`
- Get user dashboard statistics
- Returns:
  ```typescript
  {
    shipments: { total, inTransit, pending, delivered },
    recentShipments: [...],
    notifications: { unread },
    supportTickets: { open }
  }
  ```

---

## 🔐 Authentication

All API routes (except public tracking) require:
- NextAuth session
- User must be logged in
- Users can only access their own data

## 🎯 Next Steps

### Pending Tasks:
1. ✅ Schemas created
2. ✅ API routes created
3. ⏳ Update Dashboard components to use real data:
   - DashboardOverview
   - MyAssetsListSection
   - TrackShipmentSection
   - NotificationsSection
   - MyProfileSection
   - SubmitAssetSection

---

## 🧪 Testing API Routes

### Using Postman/Thunder Client:

**1. Login first to get session cookie**
```
POST http://localhost:3000/api/auth/callback/credentials
```

**2. Test Shipments**
```
GET http://localhost:3000/api/shipments
POST http://localhost:3000/api/shipments
GET http://localhost:3000/api/shipments/[id]
GET http://localhost:3000/api/shipments/track/NSC123456789
```

**3. Test Notifications**
```
GET http://localhost:3000/api/notifications?filter=unread
PATCH http://localhost:3000/api/notifications/[id]
POST http://localhost:3000/api/notifications/mark-all-read
```

**4. Test Support Tickets**
```
POST http://localhost:3000/api/support-tickets
GET http://localhost:3000/api/support-tickets?status=open
PATCH http://localhost:3000/api/support-tickets/[id]
```

**5. Test User Stats**
```
GET http://localhost:3000/api/user/stats
```

---

## 📊 Database Indexes (Recommended)

To optimize performance, create these indexes in MongoDB:

```javascript
// Shipments
db.shipments.createIndex({ userId: 1, createdAt: -1 });
db.shipments.createIndex({ trackingId: 1 }, { unique: true });
db.shipments.createIndex({ status: 1 });

// Notifications
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, isRead: 1 });

// Support Tickets
db.support_tickets.createIndex({ userId: 1, createdAt: -1 });
db.support_tickets.createIndex({ ticketNumber: 1 }, { unique: true });
db.support_tickets.createIndex({ status: 1 });
```

---

**Created:** October 22, 2025
**Database:** logistics (MongoDB)
**Collections:** users, shipments, notifications, support_tickets

