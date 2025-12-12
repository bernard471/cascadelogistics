# 🚀 Quick Test Guide - User Dashboard with MongoDB

## ⚡ **Quick Start (3 Steps):**

### **Step 1: Clear Cache & Restart**
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

### **Step 2: Seed Sample Data (Optional)**
```powershell
node scripts/seed-sample-data.js
```
This will create 2 sample shipments and 3 notifications for testing.

### **Step 3: Login & Test**
```
http://localhost:3000/member-login
Username: bernardo471
Password: <your-password>
```

---

## ✅ **What to Test:**

### **1. Dashboard Overview** (`/user-dashboard`)
- [ ] Shows real shipment counts
- [ ] Displays recent shipments (or "No shipments" if none)
- [ ] Quick action buttons work

### **2. Submit an Asset** (`/user-dashboard/submit-asset`)
- [ ] Fill out all required fields
- [ ] Click "Submit Asset"
- [ ] See success message with tracking ID
- [ ] Auto-redirects to tracking page
- [ ] **Verify in MongoDB:** Check `shipments` collection

### **3. My Assets List** (`/user-dashboard/assets-list`)
- [ ] Shows all your shipments
- [ ] Search works (try searching by tracking ID)
- [ ] Status filter dropdown works
- [ ] Click tracking ID → goes to track page
- [ ] Pagination appears if > 10 items

### **4. Track Shipment** (`/user-dashboard/track-shipment`)
- [ ] Shows recent shipments for quick access
- [ ] Click any shipment → loads tracking details
- [ ] Or manually enter tracking ID
- [ ] Timeline shows progress
- [ ] Package details display correctly

### **5. Notifications** (`/user-dashboard/notifications`)
- [ ] Shows all notifications
- [ ] Unread count badge works
- [ ] Click "Mark as read" → notification updates
- [ ] Click "Delete" → notification removed
- [ ] "Mark all as read" button works
- [ ] Filter buttons work (All/Unread/Read)

### **6. My Profile** (`/user-dashboard/profile`)
- [ ] Profile loads automatically
- [ ] Shows your name, email, etc.
- [ ] Click "Edit Profile"
- [ ] Update any field (phone, address, bio)
- [ ] Click "Save Changes"
- [ ] See success message
- [ ] **Verify in MongoDB:** Check `users` collection

---

## 🔍 **Verify in MongoDB:**

### **Check Shipments:**
```javascript
db.shipments.find({ userId: ObjectId("YOUR_USER_ID") })
```

### **Check Notifications:**
```javascript
db.notifications.find({ userId: "YOUR_USER_ID" })
```

### **Check User Profile:**
```javascript
db.users.findOne({ email: "basare471@gmail.com" })
```

---

## 📊 **Expected Behavior:**

### **First Time Login (No Data):**
```
✅ Dashboard shows "0" for all stats
✅ "No shipments yet" message with CTA
✅ Empty notifications list
✅ Profile shows your registration data
```

### **After Creating First Shipment:**
```
✅ Dashboard stats update (Total: 1, Pending: 1)
✅ Shipment appears in "My Assets List"
✅ Can track by tracking ID
✅ Recent shipments shows in track page
```

### **After Seeding Sample Data:**
```
✅ Dashboard shows 2-3 shipments
✅ Stats update automatically
✅ Notifications show 3 items (2 unread, 1 read)
✅ Can filter, mark read, delete notifications
```

---

## 🎯 **Complete Feature Test:**

1. **Login** as Bernard
2. **Go to Dashboard** - See stats (0 or sample data)
3. **Submit an Asset:**
   - Sender: Your info
   - Receiver: Any test address
   - Package: Parcel, 2kg, $100
   - Service: Express
   - Click Submit
4. **Watch it redirect** to tracking page
5. **Check Dashboard** - Stats should update!
6. **Go to My Assets** - New shipment listed
7. **Go to Profile** - Update your phone number
8. **Save** - See success message
9. **Check Notifications** - Should have notifications from sample data

---

## 🛠️ **API Endpoints Available:**

```
Shipments:
- POST   /api/shipments
- GET    /api/shipments?status=all&limit=10
- GET    /api/shipments/[id]
- PUT    /api/shipments/[id]
- DELETE /api/shipments/[id]
- GET    /api/shipments/track/[trackingId]

Notifications:
- POST   /api/notifications
- GET    /api/notifications?filter=all
- PATCH  /api/notifications/[id]
- DELETE /api/notifications/[id]
- POST   /api/notifications/mark-all-read

Support:
- POST   /api/support-tickets
- GET    /api/support-tickets?status=all
- PATCH  /api/support-tickets/[id]
- DELETE /api/support-tickets/[id]

User:
- GET    /api/user/stats
- GET    /api/user/profile
- PUT    /api/user/profile
```

---

**Everything is ready! Start testing and enjoy your fully integrated User Dashboard!** 🎉

