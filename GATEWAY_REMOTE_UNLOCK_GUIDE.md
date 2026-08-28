# TTLock G4 Gateway Remote Unlock Implementation

## ✅ Completed Backend Implementation

### 1. **Extended TTLockService** (`backend/src/services/ttlockService.ts`)
Added the following methods for gateway-based remote control:

- **`remoteUnlock(lockId)`** - Send unlock command to kayak via G4 gateway
- **`remoteLock(lockId)`** - Send lock command to kayak via G4 gateway
- **`getLockState(lockId)`** - Check if lock is currently locked/unlocked
- **`getLockBattery(lockId)`** - Check battery level of the lock
- **`getGatewaysForLock(lockId)`** - Find which gateways can communicate with a lock
- **`getLocksForGateway(gatewayId)`** - List all locks a gateway can reach

### 2. **Updated Rental Model** (`backend/src/models/rental.ts`)
Added fields to track remote unlock operations:
- `lockId` - TTLock ID for the kayak's lock
- `remoteUnlockTriggered` - Boolean flag when remote unlock is used
- `lockStatus` - Current state (0=locked, 1=unlocked, 2=unknown)
- `lastStatusUpdate` - Timestamp of last status check
- `rentalStatus` - Track rental lifecycle (active/completed/cancelled)

### 3. **New RentalController Methods** (`backend/src/controllers/rentalController.ts`)

#### `POST /api/rental/remote-unlock` - Unlock a kayak remotely
```json
Request:
{
  "rentalId": "rental_object_id"
}

Response:
{
  "success": true,
  "message": "Kayak unlocked successfully!",
  "kayakName": "Kayak A"
}
```

#### `POST /api/rental/remote-lock` - Lock a kayak remotely
```json
Request:
{
  "rentalId": "rental_object_id"
}

Response:
{
  "success": true,
  "message": "Kayak locked successfully!",
  "kayakName": "Kayak A",
  "lockStatus": 0
}
```

#### `GET /api/rental/lock-status` - Check lock status
```
GET /api/rental/lock-status?rentalId=rental_object_id

Response:
{
  "success": true,
  "lockStatus": 1,  // 0=locked, 1=unlocked, 2=unknown
  "statusText": "unlocked",
  "kayakName": "Kayak A",
  "lastUpdated": "2026-08-01T10:30:00.000Z"
}
```

#### `GET /api/rental/lock-battery` - Check battery level
```
GET /api/rental/lock-battery?rentalId=rental_object_id

Response:
{
  "success": true,
  "battery": 85,
  "kayakName": "Kayak A",
  "batteryStatus": "good"
}
```

### 4. **Updated Rental Routes** (`backend/src/routes/rentalRoutes.ts`)
- `POST /api/rental/remote-unlock` 
- `POST /api/rental/remote-lock`
- `GET /api/rental/lock-status`
- `GET /api/rental/lock-battery`

---

## 🔧 Environment Configuration

### Required .env Variables
```
TTLOCK_CLIENT_ID=your_app_client_id
TTLOCK_CLIENT_SECRET=your_app_client_secret
TTLOCK_USERNAME=your_ttlock_account_username
TTLOCK_PASSWORD=your_ttlock_account_password
TTLOCK_ACCESS_TOKEN=pre_configured_token_optional
```

### How to Get Credentials
1. Register developer account at https://euopen.ttlock.com
2. Create an application to get `TTLOCK_CLIENT_ID` and `TTLOCK_CLIENT_SECRET`
3. Download TTLock App and create a user account
4. Add locks and gateway to your account
5. Use app account credentials as `TTLOCK_USERNAME` and `TTLOCK_PASSWORD`

---

## 📱 Frontend/Mobile Integration TODO

### Web Frontend (`frontend/src/`)
Need to add:
1. **Unlock Button** - Display "Unlock Now" on active rental details
2. **Lock Button** - Display "Lock Kayak" after rental returns
3. **Lock Status Display** - Show current lock state (locked/unlocked)
4. **Battery Indicator** - Display lock battery level (% or icon)
5. **Loading States** - Handle 30-second timeout for gateway operations
6. **Error Handling** - Show user-friendly error messages

### Mobile App (`mobile/src/`)
Need to add:
1. **Remote Unlock Tab** - Dedicated unlock interface
2. **Real-time Status** - Poll lock status every 10 seconds
3. **Battery Monitor** - Alert if battery drops below 20%
4. **Offline Fallback** - Show passcode if remote unlock fails
5. **Unlock History** - Track remote unlock events
6. **Error Recovery** - Suggest passcode as backup when gateway fails

### React Components to Create
```
frontend/src/components/
├── RemoteUnlock/
│   ├── UnlockButton.tsx
│   ├── LockStatusDisplay.tsx
│   ├── BatteryIndicator.tsx
│   └── UnlockStatus.tsx
└── RentalDetails/
    └── RemoteControlPanel.tsx
```

---

## 🏗️ Architecture Overview

```
User App → REST API → RentalController → TTLockService → TTLock Cloud API
                                              ↓
                                        G4 Gateway (on-site)
                                              ↓
                                        Bluetooth Lock
```

### Operation Flow

#### Remote Unlock
1. User taps "Unlock" button in app
2. Frontend sends `POST /api/rental/remote-unlock`
3. Backend calls `ttlockService.remoteUnlock(lockId)`
4. TTLock cloud sends command to G4 gateway
5. Gateway sends Bluetooth unlock command to kayak lock
6. Lock unlocks (physical mechanism)
7. Response returned to user (max 30 second timeout)

#### Lock Status Check
1. User views rental details
2. Frontend polls `GET /api/rental/lock-status`
3. Backend queries TTLock API for current lock state
4. Response includes: locked/unlocked/unknown
5. UI updates to show current status

#### Battery Monitoring
1. Admin dashboard or rental details page
2. Calls `GET /api/rental/lock-battery`
3. Shows battery percentage
4. Alerts if below threshold (e.g., 20%)

---

## ⚠️ Important Notes

### Gateway Requirements
- **Must be setup** via TTLock App before remote operations
- **Must be online** and connected to network for remote commands
- G4 gateway communicates via Bluetooth with locks
- Locks must be within Bluetooth range of gateway (~30-50 meters)

### Operation Timeouts
- Remote operations may take **5-30 seconds** 
- TTLock API timeout is 30 seconds max
- Weak Bluetooth signal (poor RSSI) increases likelihood of failure
- Multiple simultaneous operations may fail - queue them instead

### Fallback Modes
- If remote unlock fails → show time-based passcode to user
- If gateway is offline → passcode authentication only
- Passcodes are automatically generated and time-limited (auto-expire at rental end)

### Error Codes
Common TTLock errors to handle:
- `-4043` - Remote unlock not enabled on lock (enable in TTLock App settings)
- `10004` - Access token expired (service auto-refreshes)
- Gateway not connected - Gateway offline or no Bluetooth connection

---

## 🧪 Testing Checklist

- [ ] TTLock credentials configured in .env
- [ ] G4 Gateway added to TTLock account and online
- [ ] Locks added to TTLock account and discoverable by gateway
- [ ] `POST /api/rental/remote-unlock` successfully unlocks lock
- [ ] `POST /api/rental/remote-lock` successfully locks lock
- [ ] `GET /api/rental/lock-status` returns correct state
- [ ] `GET /api/rental/lock-battery` returns battery percentage
- [ ] Frontend displays unlock/lock buttons and status
- [ ] Error handling works when gateway offline
- [ ] Timeout handling works (30 second limit)
- [ ] Rental can be completed with remote lock
- [ ] Battery low alert displays when < 20%

---

## 📚 API Reference Links

- Get started: https://euopen.ttlock.com/document/doc?urlName=userGuide%2FgetStartedEn.html
- Gateway setup: https://euopen.ttlock.com/document/doc?urlName=userGuide%2FgatewayEn.html
- Remote unlock: https://euopen.ttlock.com/document/doc?urlName=cloud%2Fgateway%2FunlockEn.html
- OAuth tokens: https://euopen.ttlock.com/document/doc?urlName=cloud%2Foauth2%2FgetAccessTokenEn.html
- Full API docs: https://euopen.ttlock.com/document/doc?urlName=cloud%2FgatewayEn.html

---

## 🔄 Next Steps

1. **Frontend Implementation**
   - Create `RemoteUnlock` component with unlock/lock buttons
   - Add lock status display to rental details
   - Implement battery level indicator
   - Add loading states during 30-second gateway operations

2. **Mobile Integration**
   - Update Unlock screen to include remote unlock option
   - Add lock status polling
   - Show battery indicator
   - Handle offline scenarios gracefully

3. **Admin Dashboard**
   - View all active locks and their status
   - Monitor gateway connectivity
   - Battery health alerts
   - Historical unlock records

4. **Production Readiness**
   - Set up monitoring/alerting for gateway connectivity
   - Implement retry logic with exponential backoff
   - Add analytics for unlock success rates
   - Create admin notifications for failed operations
