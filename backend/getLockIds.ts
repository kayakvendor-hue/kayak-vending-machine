import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * This script fetches all your TTLock locks and displays their IDs
 * Run with: npx ts-node getLockIds.ts
 */

async function getLockIds() {
    try {
        console.log('🔐 Fetching your TTLock account information...\n');

        // Step 1: Get access token
        console.log('Step 1: Authenticating with TTLock...');
        const tokenResponse = await axios.post(
            'https://euapi.ttlock.com/oauth2/token',
            `client_id=${process.env.TTLOCK_CLIENT_ID}&client_secret=${process.env.TTLOCK_CLIENT_SECRET}&grant_type=client_credentials`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        if (!tokenResponse.data.access_token) {
            console.error('❌ Failed to get access token');
            console.error('Response:', tokenResponse.data);
            return;
        }

        const accessToken = tokenResponse.data.access_token;
        console.log('✅ Successfully authenticated!\n');

        // Step 2: Get lock list
        console.log('Step 2: Fetching your locks...');
        const locksResponse = await axios.get(
            'https://euapi.ttlock.com/v3/lock/list',
            {
                params: {
                    clientId: process.env.TTLOCK_CLIENT_ID,
                    accessToken: accessToken,
                    pageNo: 1,
                    pageSize: 100,
                    date: Date.now()
                }
            }
        );

        if (locksResponse.data.errcode !== 0) {
            console.error('❌ Failed to get locks');
            console.error('Error:', locksResponse.data);
            return;
        }

        const locks = locksResponse.data.list || [];
        
        console.log(`✅ Found ${locks.length} lock(s) in your account!\n`);
        console.log('================================================');
        console.log('YOUR TTLOCK LOCK IDs:');
        console.log('================================================\n');

        if (locks.length === 0) {
            console.log('⚠️  No locks found in your account.');
            console.log('   Make sure you have added locks to your TTLock account first.\n');
        } else {
            locks.forEach((lock: any, index: number) => {
                console.log(`Lock ${index + 1}:`);
                console.log(`  Name: ${lock.lockAlias || lock.lockName || 'Unnamed'}`);
                console.log(`  Lock ID: ${lock.lockId} 👈 USE THIS NUMBER`);
                console.log(`  MAC Address: ${lock.lockMac || 'N/A'}`);
                console.log(`  Battery: ${lock.electricQuantity || 0}%`);
                console.log('');
            });

            console.log('================================================');
            console.log('NEXT STEPS:');
            console.log('================================================\n');
            console.log('1. Copy the Lock IDs above');
            console.log('2. Open: backend/seedKayaks.ts');
            console.log('3. Replace the lockId numbers (1234567, etc.) with your real Lock IDs');
            console.log('4. Run: npx ts-node seedKayaks.ts\n');
        }

    } catch (error: any) {
        console.error('❌ Error fetching locks:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

getLockIds();
