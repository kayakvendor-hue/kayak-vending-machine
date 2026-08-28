import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/signup';

async function testRateLimiting() {
    console.log('Testing Rate Limiting on /api/auth/signup');
    console.log('Limit: 5 attempts per 15 minutes per IP');
    console.log('======================================\n');

    for (let i = 1; i <= 7; i++) {
        try {
            const response = await axios.post(API_URL, {
                email: `test-${i}-${Date.now()}@example.com`,
                password: 'TestPassword123!'
            });

            console.log(`Attempt ${i}:`);
            console.log(`  Status: ${response.status}`);
            console.log(`  Message: ${response.data.message}`);
            console.log(`  Rate-Limit-Remaining: ${response.headers['ratelimit-remaining']}`);
            console.log(`  Rate-Limit-Reset: ${response.headers['ratelimit-reset']}`);
            console.log('');
        } catch (error: any) {
            console.log(`Attempt ${i}:`);
            console.log(`  Status: ${error.response?.status}`);
            console.log(`  Message: ${error.response?.data?.message}`);
            console.log(`  Rate-Limit-Remaining: ${error.response?.headers['ratelimit-remaining']}`);
            console.log(`  Rate-Limit-Reset: ${error.response?.headers['ratelimit-reset']}`);
            console.log('');

            // If we get rate limited, stop
            if (error.response?.status === 429) {
                console.log('✅ RATE LIMITING WORKING! Request blocked after limit reached.');
                break;
            }
        }
    }
}

testRateLimiting().catch(console.error);
