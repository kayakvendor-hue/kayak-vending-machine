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
                console.error('❌ TTLock API Error:', response.data);
                throw new Error(`TTLock error ${response.data.errcode}: ${response.data.errmsg || 'Unknown error'}`);
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
            
            const params = {
                clientId: this.clientId,
                accessToken: this.accessToken!,
                lockId: lockId.toString(),
                keyboardPwdId: passcodeId.toString(),
                deleteType: '2', // 2 = Delete from lock
                date: Date.now().toString()
            };

            const response = await axios.post(
                `${this.apiUrl}/v3/keyboardPwd/delete`,
                null,
                {
                    params
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
     * Generate a random 6-digit passcode
     */
    private generateRandomPasscode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}

export default TTLockService;