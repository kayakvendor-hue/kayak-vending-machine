# Integration Guide: Adding Remote Unlock to Your App

## Frontend (React Web) Integration

### Step 1: Import the Component
```tsx
// In your rental details page or component
import RemoteUnlockPanel from '../components/RemoteUnlock/RemoteUnlockPanel';
```

### Step 2: Add to Your Page
```tsx
// In your rental details page
import React from 'react';
import RemoteUnlockPanel from '../components/RemoteUnlock/RemoteUnlockPanel';

interface RentalDetailsProps {
  rentalId: string;
  kayakName: string;
}

export const RentalDetailsPage: React.FC<RentalDetailsProps> = ({ rentalId, kayakName }) => {
  return (
    <div className="rental-details">
      <h1>Rental Details</h1>
      
      {/* Your existing rental info */}
      <div className="rental-info">
        {/* ... */}
      </div>

      {/* Add the remote unlock panel */}
      <RemoteUnlockPanel 
        rentalId={rentalId} 
        kayakName={kayakName} 
      />

      {/* Your passcode display as fallback */}
      <div className="passcode-fallback">
        {/* ... */}
      </div>
    </div>
  );
};
```

### Step 3: Make Sure localStorage Token is Set
The component expects `localStorage.getItem('token')` to contain the JWT token:

```tsx
// After login
localStorage.setItem('token', loginResponse.token);
```

### Step 4: (Optional) Customize Styling
Override CSS in your component or import file:

```css
/* Override default colors if needed */
.remote-unlock-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-unlock {
  background: rgba(76, 175, 80, 0.3);
}

/* etc... */
```

---

## Mobile (React Native/Expo) Integration

### Step 1: Import the Screen
```tsx
// In your navigation/routing setup
import RemoteUnlockScreen from '../screens/RemoteUnlockScreen';
```

### Step 2: Add to Your Navigation Stack
```tsx
// In your UnlockTab or wherever you want to show it
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RemoteUnlockScreen from '../screens/RemoteUnlockScreen';

const UnlockStack = createNativeStackNavigator();

export const UnlockNavigator = () => (
  <UnlockStack.Navigator>
    <UnlockStack.Screen 
      name="RemoteUnlock" 
      component={RemoteUnlockScreen}
      options={{ title: 'Remote Lock Control' }}
    />
  </UnlockStack.Navigator>
);
```

### Step 3: Link from Rental Screen
```tsx
// In your active rental details screen
import { useNavigation } from '@react-navigation/native';

export const ActiveRentalScreen = ({ route }) => {
  const navigation = useNavigation();
  const { rentalId, kayakName } = route.params;

  return (
    <View>
      <Text>Active Rental: {kayakName}</Text>
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('RemoteUnlock', { rentalId, kayakName })}
      >
        <Text>🔐 Control Lock Remotely</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Step 4: Ensure ApiService is Configured
```tsx
// In your services/ApiService.ts
// Make sure API_URL is set correctly

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const ApiService = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${await getToken()}`,
      },
    });
    return response.json();
  },

  async post(endpoint: string, body: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`,
      },
      body: JSON.stringify(body),
    });
    return response.json();
  },
};
```

---

## Updating Your API Service

### Make sure your ApiService supports these endpoints:

```tsx
// backend/services/api.ts or similar
const ENDPOINTS = {
  RENTAL_REMOTE_UNLOCK: '/rental/remote-unlock',
  RENTAL_REMOTE_LOCK: '/rental/remote-lock',
  RENTAL_LOCK_STATUS: '/rental/lock-status',
  RENTAL_LOCK_BATTERY: '/rental/lock-battery',
};

// Example wrapper functions for easier calling
export const RentalAPI = {
  async remoteUnlock(rentalId: string) {
    return ApiService.post(ENDPOINTS.RENTAL_REMOTE_UNLOCK, { rentalId });
  },

  async remoteLock(rentalId: string) {
    return ApiService.post(ENDPOINTS.RENTAL_REMOTE_LOCK, { rentalId });
  },

  async getLockStatus(rentalId: string) {
    return ApiService.get(`${ENDPOINTS.RENTAL_LOCK_STATUS}?rentalId=${rentalId}`);
  },

  async getLockBattery(rentalId: string) {
    return ApiService.get(`${ENDPOINTS.RENTAL_LOCK_BATTERY}?rentalId=${rentalId}`);
  },
};
```

---

## Backend Verification

### Ensure These Routes Exist
```bash
# Check backend/src/routes/rentalRoutes.ts
POST   /api/rental/remote-unlock
POST   /api/rental/remote-lock
GET    /api/rental/lock-status
GET    /api/rental/lock-battery
```

### Ensure TTLock Service is Initialized
```bash
# Check backend/src/services/ttlockService.ts has these methods:
- remoteUnlock(lockId)
- remoteLock(lockId)
- getLockState(lockId)
- getLockBattery(lockId)
- getGatewaysForLock(lockId)
- getLocksForGateway(gatewayId)
```

### Ensure Rental Model Has New Fields
```bash
# Check backend/src/models/rental.ts has:
- lockId: Number
- remoteUnlockTriggered: Boolean
- lockStatus: Number (0/1/2)
- lastStatusUpdate: Date
- rentalStatus: String (active/completed/cancelled)
```

---

## Minimal Example: Quick Integration

If you want a very simple integration without all the features:

### Frontend (Minimal)
```tsx
import React, { useState } from 'react';

export const QuickUnlockButton = ({ rentalId }) => {
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rental/remote-unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rentalId })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Kayak unlocked!');
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleUnlock} disabled={loading}>
      {loading ? 'Unlocking...' : 'Unlock Kayak'}
    </button>
  );
};
```

---

## Environment Variables Needed

### Backend (.env file)
```
# Required for remote unlock via gateway
TTLOCK_CLIENT_ID=your_client_id_here
TTLOCK_CLIENT_SECRET=your_client_secret_here
TTLOCK_USERNAME=your_ttlock_app_account
TTLOCK_PASSWORD=your_ttlock_app_password

# Optional: Pre-configured token (skip OAuth)
TTLOCK_ACCESS_TOKEN=optional_token_string

# Existing variables
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kayak
JWT_SECRET=your_secret_here
STRIPE_SECRET_KEY=...
# etc
```

### Frontend (.env file)
```
# Make sure your API endpoint is correct
REACT_APP_API_URL=http://localhost:5000/api
# or for production:
REACT_APP_API_URL=https://your-domain.com/api
```

### Mobile (.env file)
```
EXPO_PUBLIC_API_URL=http://your-backend.com/api
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

---

## Testing the Integration

### Test 1: Create a Rental
```bash
POST /api/rental/rent
{
  "kayakId": "kayak_id_here"
  "rentalDuration": 3600  # 1 hour in seconds
}
# Response includes rentalId
```

### Test 2: Try Remote Unlock
```bash
POST /api/rental/remote-unlock
{
  "rentalId": "rental_id_from_step_1"
}
# Should succeed if gateway is online and lock in range
```

### Test 3: Check Status
```bash
GET /api/rental/lock-status?rentalId=rental_id_from_step_1
# Returns: { lockStatus: 1, statusText: "unlocked" }
```

### Test 4: Try Remote Lock
```bash
POST /api/rental/remote-lock
{
  "rentalId": "rental_id_from_step_1"
}
# Should lock the kayak
```

---

## Troubleshooting Integration

### Issue: Components not found
**Solution:** Make sure files exist at these paths:
- `frontend/src/components/RemoteUnlock/RemoteUnlockPanel.tsx`
- `frontend/src/components/RemoteUnlock/RemoteUnlockPanel.css`
- `mobile/src/screens/RemoteUnlockScreen.tsx`

### Issue: API endpoints 404
**Solution:** Verify routes are added:
- `backend/src/routes/rentalRoutes.ts` has all 4 routes

### Issue: Buttons disabled immediately
**Solution:** Likely already locked/unlocked. Try these:
1. Create fresh rental first
2. Unlock should work initially (status unknown/unlocked)
3. Lock should work after (status locked)

### Issue: "Gateway unreachable" error
**Solution:** 
1. Verify gateway online in TTLock App
2. Check lock is within 30 meters of gateway
3. Verify gateway has internet connectivity
4. Check "Remote unlock" enabled on the lock

### Issue: Token not found
**Solution:**
- Make sure token is set in localStorage after login
- Verify Bearer token format in API calls
- Check token hasn't expired

---

## Next Steps (Optional Enhancements)

1. **Battery Alerts**
   - Show warning when battery < 20%
   - Disable unlock if battery critical

2. **Usage Analytics**
   - Track remote unlock success rate
   - Monitor average operation times
   - Alert if gateway consistently fails

3. **Admin Dashboard**
   - View all locks and their status
   - Monitor gateway connectivity
   - See historical unlock records

4. **Notifications**
   - Email when lock status changes
   - SMS alerts for failed operations
   - Push notifications on mobile

5. **Fallback Scenarios**
   - Queue unlock requests if gateway unavailable
   - Retry with exponential backoff
   - Show passcode if remote fails

6. **Advanced Features**
   - Schedule unlock/lock at specific times
   - Multi-user shared access
   - Temporary access codes for staff
   - Emergency unlock override

---

## Support

For issues or questions:

1. Check **TESTING_GUIDE.md** for common problems
2. Check **GATEWAY_REMOTE_UNLOCK_GUIDE.md** for architecture details
3. Review TTLock docs: https://euopen.ttlock.com
4. Check server logs: `npm run dev` output
5. Monitor database: View rental documents in MongoDB

Good luck! 🚀
