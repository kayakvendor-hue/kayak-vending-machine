import axios from 'axios';
import md5 from 'md5';

export class TTLockService {
    private apiUrl: string;
    private clientId: string;
    private clientSecret: string;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor(apiUrl: string, clientId: string, clientSecret: string) {
        this.apiUrl = apiUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    /**
     * Generate a RANDOM TIMED passcode for a lock (doesn't need gateway)
     * @param lockId - The TTLock lock ID
     * @param startDate - When the passcode becomes valid (timestamp in ms)
     * @param endDate - When the passcode expires (timestamp in ms)
     * @returns Object containing the generated passcode and passcodeId
     */
    async generatePasscode(lockId: number, startDate: number, endDate: number): Promise<{ passcode: string; passcodeId: number }> {
        console.log(`🔐 Attempting to generate RANDOM TIMED passcode for lock ${lockId}`);
        console.log(`⏰ Valid from ${new Date(startDate)} to ${new Date(endDate)}`);
        
        await this.ensureAccessToken();
        console.log(`✅ Access token obtained: ${this.accessToken?.substring(0, 20)}...`);

        try {
            // TTLock API endpoint for getting RANDOM passcode (no gateway needed)
            // Try GET method with query parameters
            const params = {
                clientId: this.clientId,
                accessToken: this.accessToken!,
                lockId: lockId.toString(),
                keyboardPwdType: '3', // 3 = Period/Timed passcode
                keyboardPwdName: 'Kayak Rental',
                startDate: startDate.toString(),
                endDate: endDate.toString(),
                date: Date.now().toString()
            };
            
            console.log(`📤 Requesting random timed passcode from TTLock API`);
            console.log(`   Endpoint: ${this.apiUrl}/v3/keyboardPwd/get`);
            console.log(`   Parameters:`, params);
            
            const response = await axios.get(
                `${this.apiUrl}/v3/keyboardPwd/get`,
                { params }
            );

            console.log(`📥 TTLock API Response:`, response.data);

            if (response.data.keyboardPwd) {
                const passcode = response.data.keyboardPwd;
                const passcodeId = response.data.keyboardPwdId;
                console.log(`✅ Random passcode successfully generated: ${passcode} (ID: ${passcodeId})`);
                return { passcode, passcodeId };
            } else if (response.data.errcode !== undefined && response.data.errcode !== 0) {
                console.error('❌ API Error:', response.data);
                throw new Error(`API error ${response.data.errcode}: Unable to generate passcode`);
            } else {
                throw new Error('No passcode in response');
            }
        } catch (error: any) {
            console.error('❌ Failed to get TTLock random passcode:', error.response?.data || error.message);
            // Fallback to random passcode if API fails
            const fallback = this.generateRandomPasscode();
            console.log(`⚠️ Using fallback passcode: ${fallback}`);
            return { passcode: fallback, passcodeId: 0 };
        }
    }

    /**
     * Delete a passcode from a lock
     * @param lockId - The TTLock lock ID
     * @param passcodeId - The passcode ID to delete
     */
    async deletePasscode(lockId: number, passcodeId: number): Promise<boolean> {
        await this.ensureAccessToken();

        try {
            console.log(`🗑️ Deleting keyboard passcode ID ${passcodeId} from lock ${lockId}`);
            
            const params = new URLSearchParams({
                clientId: this.clientId,
                accessToken: this.accessToken!,
                lockId: lockId.toString(),
                keyboardPwdId: passcodeId.toString(),
                deleteType: '2', // 2 = Delete from lock
                date: Date.now().toString()
            });

            console.log(`📤 POST ${this.apiUrl}/v3/keyboardPwd/delete`);

            const response = await axios.post(
                `${this.apiUrl}/v3/keyboardPwd/delete`,
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            console.log(`📥 TTLock delete response:`, response.data);

            if (response.data.errcode === 0) {
                console.log(`✅ Passcode deleted successfully`);
                return true;
            } else {
                console.error(`❌ TTLock delete error:`, response.data);
                return false;
            }
        } catch (error: any) {
            console.error('❌ Failed to delete TTLock passcode:', error.response?.data || error.message);
            return false;
        }
    }

    /**
     * Ensure we have a valid access token
     */
    private async ensureAccessToken(): Promise<void> {
        const now = Date.now();
        if (!this.accessToken || now >= this.tokenExpiry) {
            await this.getAccessToken();
        }
    }

    /**
     * Execute a function with retry logic for gateway busy errors
     * Retries up to 3 times with exponential backoff (500ms, 1000ms, 2000ms)
     */
    private async executeWithRetry<T>(
        fn: () => Promise<T>,
        maxRetries: number = 3
    ): Promise<T> {
        let lastError: any;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error: any) {
                lastError = error;
                
                // Check if error is retryable (gateway busy -3003)
                const isRetryable = error.retryable === true || 
                    error.response?.data?.errcode === -3003;
                
                if (!isRetryable || attempt === maxRetries) {
                    // If we got error code 1, try refreshing token on last attempt
                    if (error.response?.data?.errcode === 1 && attempt < maxRetries) {
                        console.log(`🔑 Error code 1 detected, refreshing token and retrying...`);
                        this.accessToken = null; // Force token refresh
                        this.tokenExpiry = 0;
                        continue;
                    }
                    throw error;
                }
                
                // Exponential backoff: 500ms, 1000ms, 2000ms
                const delayMs = 500 * Math.pow(2, attempt - 1);
                console.log(`⏳ Gateway busy, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        
        throw lastError;
    }

    /**
     * Get access token from TTLock OAuth using username/password
     */
    private async getAccessToken(): Promise<void> {
        // Check if we have a pre-configured access token from .env
        const envToken = process.env.TTLOCK_ACCESS_TOKEN;
        if (envToken && envToken.length > 0) {
            console.log('✅ Using pre-configured TTLock access token from environment');
            this.accessToken = envToken;
            this.tokenExpiry = Date.now() + (7776000 * 1000); // 90 days
            return;
        }

        // Authenticate with username and password
        const username = process.env.TTLOCK_USERNAME;
        const password = process.env.TTLOCK_PASSWORD;

        if (!username || !password) {
            throw new Error('TTLock username and password not configured. Add TTLOCK_USERNAME and TTLOCK_PASSWORD to .env file');
        }

        try {
            // Password must be MD5 encrypted (32 chars, lowercase)
            const passwordMd5 = md5(password).toLowerCase();

            const params = new URLSearchParams({
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                username: username,
                password: passwordMd5
            });

            console.log(`🔑 Authenticating with TTLock using username: ${username}`);

            const response = await axios.post(
                `${this.apiUrl}/oauth2/token`,
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data.access_token) {
                this.accessToken = response.data.access_token;
                const expiresIn = response.data.expires_in || 7776000; // Default 90 days
                this.tokenExpiry = Date.now() + (expiresIn * 1000);
                console.log(`✅ TTLock authentication successful! Token expires in ${expiresIn} seconds`);
            } else {
                throw new Error('Failed to get access token from response');
            }
        } catch (error: any) {
            console.error('❌ TTLock authentication failed:', error.response?.data || error.message);
            throw new Error('Unable to authenticate with TTLock service');
        }
    }

    /**
     * Remotely unlock a lock via Bluetooth using TTLock API
     * @param lockId - The TTLock lock ID
     * @returns Whether the unlock was successful
     */
    async remoteUnlock(lockId: number): Promise<boolean> {
        return this.executeWithRetry(async () => {
            await this.ensureAccessToken();

            try {
                console.log(`🔓 Sending remote unlock command to lock ${lockId}`);
                
                if (!lockId || lockId === 0) {
                    throw new Error('Invalid lock ID: Lock ID is missing or invalid');
                }
                
                const params = new URLSearchParams({
                    clientId: this.clientId,
                    accessToken: this.accessToken!,
                    lockId: lockId.toString(),
                    date: Date.now().toString()
                });

                console.log(`📤 POST ${this.apiUrl}/v3/lock/unlock`);
                console.log(`   lockId type: ${typeof lockId}, value: ${lockId}`);
                console.log(`   Parameters:`, {
                    clientId: this.clientId,
                    accessToken: this.accessToken?.substring(0, 20) + '...',
                    lockId: lockId.toString(),
                    date: Date.now().toString()
                });

                const response = await axios.post(
                    `${this.apiUrl}/v3/lock/unlock`,
                    params,
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        timeout: 30000
                    }
                );

                console.log(`📥 TTLock unlock response:`, response.data);

                if (response.data.errcode === 0) {
                    console.log(`✅ Remote unlock successful for lock ${lockId}`);
                    return true;
                } else if (response.data.errcode === -3003) {
                    // Gateway is busy - throw as retryable error
                    const err: any = new Error('Gateway is busy - please try again.');
                    err.retryable = true;
                    throw err;
                } else if (response.data.errcode === 1) {
                    // Error code 1 could mean: lock already unlocked, invalid parameters, or lock doesn't support remote unlock
                    console.warn(`⚠️  TTLock returned error code 1. This might mean:`);
                    console.warn(`   - Lock is already in the requested state`);
                    console.warn(`   - Lock doesn't support remote unlock via this gateway`);
                    console.warn(`   - Parameter mismatch or invalid request format`);
                    // Treat this as a non-retryable error
                    throw new Error('Gateway error: Unable to unlock - the lock may already be unlocked or offline. Please try again.');
                } else {
                    console.error(`❌ TTLock unlock error (${response.data.errcode}):`, response.data.errmsg);
                    throw new Error('Gateway error: Unable to complete lock operation. Please try again.');
                }
            } catch (error: any) {
                const errorMsg = error.response?.data?.errmsg || error.message || 'Unknown error';
                if (!error.retryable) {
                    console.error('❌ Failed to remote unlock:', errorMsg);
                    
                    // Provide more user-friendly error messages
                    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
                        throw new Error('Gateway unreachable - lock may be offline or out of range');
                    }
                    if (error.response?.data?.errcode === 10037) {
                        throw new Error('Lock offline - gateway cannot reach the lock');
                    }
                    if (error.response?.data?.errcode === 10038) {
                        throw new Error('Gateway offline or unreachable');
                    }
                }
                
                throw error;
            }
        });
    }


    /**
     * Get the open/locked state of a lock via gateway
     * @param lockId - The TTLock lock ID
     * @returns Lock state: 0=locked, 1=unlocked, 2=unknown
     */
    async getLockState(lockId: number): Promise<number> {
        await this.ensureAccessToken();

        try {
            console.log(`📊 Querying lock state for lock ${lockId}`);
            
            const params = {
                clientId: this.clientId,
                accessToken: this.accessToken!,
                lockId: lockId.toString(),
                date: Date.now().toString()
            };

            console.log(`📤 GET ${this.apiUrl}/v3/lock/queryOpenState`);

            const response = await axios.get(
                `${this.apiUrl}/v3/lock/queryOpenState`,
                { params }
            );

            console.log(`📥 TTLock state response:`, response.data);

            const state = response.data.state;
            const stateText = state === 0 ? 'locked' : state === 1 ? 'unlocked' : 'unknown';
            console.log(`✅ Lock ${lockId} state: ${stateText} (${state})`);
            return state;
        } catch (error: any) {
            console.error('❌ Failed to query lock state:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get the battery level of a lock via gateway
     * @param lockId - The TTLock lock ID
     * @returns Battery percentage (0-100)
     */
    async getLockBattery(lockId: number): Promise<number> {
        await this.ensureAccessToken();

        try {
            console.log(`🔋 Querying battery level for lock ${lockId}`);
            
            const params = {
                clientId: this.clientId,
                accessToken: this.accessToken!,
                lockId: lockId.toString(),
                date: Date.now().toString()
            };

            console.log(`📤 GET ${this.apiUrl}/v3/lock/queryElectricQuantity`);

            const response = await axios.get(
                `${this.apiUrl}/v3/lock/queryElectricQuantity`,
                { params }
            );

            console.log(`📥 TTLock battery response:`, response.data);

            const battery = response.data.electricQuantity;
            console.log(`✅ Lock ${lockId} battery: ${battery}%`);
            return battery;
        } catch (error: any) {
            console.error('❌ Failed to query lock battery:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get all gateways that can communicate with a specific lock
     * @param lockId - The TTLock lock ID
     * @returns Array of gateway info objects
     */
    async getGatewaysForLock(lockId: number): Promise<any[]> {
        await this.ensureAccessToken();

        try {
            console.log(`🌐 Querying gateways for lock ${lockId}`);
            
            const params = {
                clientId: this.clientId,
                accessToken: this.accessToken!,
                lockId: lockId.toString(),
                date: Date.now().toString()
            };

            console.log(`📤 GET ${this.apiUrl}/v3/gateway/listByLock`);

            const response = await axios.get(
                `${this.apiUrl}/v3/gateway/listByLock`,
                { params }
            );

            console.log(`📥 TTLock gateway list response:`, response.data);

            const gateways = response.data.list || [];
            console.log(`✅ Found ${gateways.length} gateway(s) for lock ${lockId}`);
            return gateways;
        } catch (error: any) {
            console.error('❌ Failed to query gateways for lock:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get all locks that a gateway can communicate with
     * @param gatewayId - The TTLock gateway ID
     * @returns Array of lock info objects
     */
    async getLocksForGateway(gatewayId: number): Promise<any[]> {
        await this.ensureAccessToken();

        try {
            console.log(`🔑 Querying locks for gateway ${gatewayId}`);
            
            const params = {
                clientId: this.clientId,
                accessToken: this.accessToken!,
                gatewayId: gatewayId.toString(),
                date: Date.now().toString()
            };

            console.log(`📤 GET ${this.apiUrl}/v3/gateway/listLock`);

            const response = await axios.get(
                `${this.apiUrl}/v3/gateway/listLock`,
                { params }
            );

            console.log(`📥 TTLock lock list response:`, response.data);

            const locks = response.data.list || [];
            console.log(`✅ Found ${locks.length} lock(s) for gateway ${gatewayId}`);
            
            // Log cache age for debugging
            if (locks.length > 0 && locks[0].updateDate) {
                const cacheAge = Date.now() - locks[0].updateDate;
                const minutesOld = Math.floor(cacheAge / 60000);
                console.log(`📅 Gateway cache age: ${minutesOld} minutes old`);
                if (minutesOld > 20) {
                    console.log(`⚠️  Cache is getting stale (>20 min) - Gateway may need restart to refresh`);
                }
            } else if (locks.length === 0) {
                console.log(`⚠️  WARNING: Gateway returned 0 locks. Possible reasons:`);
                console.log(`   1. Gateway hasn't discovered locks yet - RESTART GATEWAY to force rediscovery`);
                console.log(`   2. Locks and gateway in different TTLock accounts`);
                console.log(`   3. Locks are out of Bluetooth range (> 30m from gateway)`);
                console.log(`   4. Remote unlock not enabled in TTLock app for locks`);
            }
            
            return locks;
        } catch (error: any) {
            console.error('❌ Failed to query locks for gateway:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Generate a random 6-digit passcode
     */
    private generateRandomPasscode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Diagnostic: Check gateway and lock connectivity
     * @param lockId - The TTLock lock ID
     * @returns Diagnostic info including gateway status and connectivity
     */
    async diagnosticCheckLock(lockId: number): Promise<{
        lockId: number;
        state: string;
        battery: number;
        gateways: any[];
        diagnostics: string[];
    }> {
        const diagnostics: string[] = [];
        
        try {
            console.log(`\n🔍 DIAGNOSTIC CHECK for lock ${lockId}\n`);
            
            // Check lock state
            let state = 'unknown';
            try {
                const stateCode = await this.getLockState(lockId);
                state = stateCode === 0 ? 'locked' : stateCode === 1 ? 'unlocked' : 'unknown';
                diagnostics.push(`✅ Lock state: ${state}`);
            } catch (e: any) {
                diagnostics.push(`❌ Cannot query lock state: ${e.message}`);
            }
            
            // Check battery
            let battery = 0;
            try {
                battery = await this.getLockBattery(lockId);
                diagnostics.push(`✅ Battery level: ${battery}%`);
                if (battery < 20) {
                    diagnostics.push(`⚠️  LOW BATTERY - Consider replacing battery`);
                }
            } catch (e: any) {
                diagnostics.push(`❌ Cannot query battery: ${e.message}`);
            }
            
            // Check gateways
            let gateways: any[] = [];
            try {
                gateways = await this.getGatewaysForLock(lockId);
                if (gateways.length === 0) {
                    diagnostics.push(`❌ NO GATEWAYS FOUND - Lock cannot be controlled remotely!`);
                } else {
                    diagnostics.push(`✅ Found ${gateways.length} gateway(s)`);
                    gateways.forEach((gw, i) => {
                        const rssi = gw.rssi || 'unknown';
                        const quality = rssi > -75 ? 'STRONG' : rssi > -85 ? 'MEDIUM' : 'WEAK';
                        diagnostics.push(`   Gateway ${i+1}: ${gw.gatewayName} (RSSI: ${rssi} - ${quality})`);
                        if (rssi < -85) {
                            diagnostics.push(`   ⚠️  WEAK SIGNAL - Lock may be far from gateway`);
                        }
                    });
                }
            } catch (e: any) {
                diagnostics.push(`❌ Cannot query gateways: ${e.message}`);
            }
            
            console.log(diagnostics.join('\n'));
            
            return {
                lockId,
                state,
                battery,
                gateways,
                diagnostics
            };
        } catch (error: any) {
            console.error('❌ Diagnostic check failed:', error.message);
            throw error;
        }
    }
}

export default TTLockService;