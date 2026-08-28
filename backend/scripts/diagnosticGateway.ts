import { TTLockService } from '../src/services/ttlockService';
import dotenv from 'dotenv';

dotenv.config();

const runDiagnostics = async () => {
    const ttlockService = new TTLockService(
        process.env.TTLOCK_API_URL || 'https://euapi.ttlock.com',
        process.env.TTLOCK_CLIENT_ID as string,
        process.env.TTLOCK_CLIENT_SECRET as string
    );

    const GATEWAY_ID = 2245851; // Kayak gateway
    const LOCK_IDS = [
        { id: 18497357, name: 'Kayak #1' },
        { id: 18499305, name: 'Kayak #2' },
        { id: 18498521, name: 'Kayak #3' },
        { id: 18501403, name: 'Kayak #4' },
        { id: 25440939, name: 'Lifejacket Box' }
    ];

    console.log('\n🔍 TTLock Gateway Diagnostic Report\n');
    console.log(`Gateway ID: ${GATEWAY_ID}`);
    console.log(`Expected Locks: ${LOCK_IDS.length}\n`);

    // Step 1: Check if gateway can see ANY locks
    console.log('=== STEP 1: Checking if gateway can see locks ===\n');
    try {
        const gatewayLocks = await ttlockService.getLocksForGateway(GATEWAY_ID);
        console.log(`✅ Gateway query successful`);
        console.log(`   Found: ${gatewayLocks.length} locks\n`);
        
        if (gatewayLocks.length === 0) {
            console.log('❌ PROBLEM: Gateway found 0 locks.\n');
            console.log('🔴 PRIMARY CAUSE - Gateway Cache Not Initialized:\n');
            console.log('   TTLock servers cache gateway-lock relationships for 30 minutes.');
            console.log('   If gateway was just added or restarted, the cache is EMPTY until');
            console.log('   the gateway discovers and reports the locks to TTLock servers.\n');
            console.log('⚡ IMMEDIATE FIX:\n');
            console.log('   1. Power cycle the G4 gateway (unplug 30 seconds, plug back in)');
            console.log('   2. Wait 2-3 minutes for gateway to boot and reconnect');
            console.log('   3. The gateway will auto-discover nearby locks');
            console.log('   4. Run this diagnostic again - should show 5 locks\n');
            console.log('📋 Alternative causes (less likely if locks paired in TTLock app):\n');
            console.log('   - Locks and gateway in different TTLock accounts');
            console.log('   - Locks out of Bluetooth range (> 30m from gateway)');
            console.log('   - Remote unlock disabled in TTLock app for locks\n');
        } else {
            console.log('Locks seen by gateway:');
            gatewayLocks.forEach((lock: any) => {
                const cacheAge = lock.updateDate ? Math.floor((Date.now() - lock.updateDate) / 60000) : 'unknown';
                const ageStatus = cacheAge !== 'unknown' && cacheAge < 2 ? '✅ Fresh' : '⚠️ Old';
                console.log(`   - ${lock.lockName} (ID: ${lock.lockId})`);
                console.log(`     └─ RSSI: ${lock.rssi} | Cache age: ${cacheAge}m ${ageStatus}`);
            });
            console.log();
        }
    } catch (error: any) {
        console.log(`❌ Failed to query gateway: ${error.message}\n`);
    }

    // Step 2: Check each lock individually
    console.log('=== STEP 2: Checking each lock individually ===\n');
    for (const lock of LOCK_IDS) {
        try {
            const gateways = await ttlockService.getGatewaysForLock(lock.id);
            if (gateways.length === 0) {
                console.log(`❌ ${lock.name} (ID: ${lock.id})`);
                console.log(`   └─ NOT connected to ANY gateway`);
            } else {
                console.log(`✅ ${lock.name} (ID: ${lock.id})`);
                gateways.forEach((gw: any) => {
                    const rssi = gw.rssi || 'unknown';
                    const quality = rssi > -75 ? '🟢 STRONG' : rssi > -85 ? '🟡 MEDIUM' : '🔴 WEAK';
                    console.log(`   └─ Gateway ${gw.gatewayId}: RSSI ${rssi} ${quality}`);
                });
            }
        } catch (error: any) {
            console.log(`⚠️  ${lock.name} (ID: ${lock.id})`);
            console.log(`   └─ Query failed: ${error.message}`);
        }
        console.log();
    }

    // Step 3: Recommendations
    console.log('=== STEP 3: Why 0 Locks Found (TTLock API Caching) ===\n');
    console.log('TTLock servers CACHE the gateway-lock relationships for 30 minutes.');
    console.log('This cache is populated when the gateway discovers locks nearby.\n');
    console.log('If you see "Found 0 locks":\n');
    console.log('✅ SOLUTION 1: Restart the Gateway (Most Likely Fix)');
    console.log('   1. Unplug G4 gateway from power');
    console.log('   2. Wait 30 seconds');
    console.log('   3. Plug back in');
    console.log('   4. Wait 2-3 minutes for gateway to boot and rediscover locks');
    console.log('   5. The gateway will auto-scan for nearby Bluetooth locks');
    console.log('   6. Run this diagnostic again\n');
    
    console.log('✅ SOLUTION 2: Verify Gateway Online');
    console.log('   - G4 gateway LED should be BLUE (WiFi connected)');
    console.log('   - If RED, check WiFi connection on gateway');
    console.log('   - Gateway needs internet to report locks to TTLock servers\n');
    
    console.log('📋 Secondary Checks (if restart doesn\'t work):');
    console.log('   1. Verify locks & gateway in SAME TTLock app account');
    console.log('   2. Ensure "Remote Unlock" is ON for each lock in TTLock app');
    console.log('   3. Check Bluetooth range - locks must be < 30m from gateway');
    console.log('   4. Try moving gateway closer to locks\n');

    process.exit(0);
};

runDiagnostics().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
