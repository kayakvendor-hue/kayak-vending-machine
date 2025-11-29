import twilio from 'twilio';

class SMSService {
    private client: any = null;

    constructor() {
        // Lazy initialization
    }

    private getClient() {
        if (!this.client) {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            
            if (!accountSid || !authToken || accountSid.includes('your_twilio')) {
                console.warn('⚠️ SMS service not configured - SMS will not be sent');
                return {
                    messages: {
                        create: async () => {
                            console.log('📱 SMS skipped (not configured)');
                            return { sid: 'mock' };
                        }
                    }
                };
            }

            this.client = twilio(accountSid, authToken);
        }
        return this.client;
    }

    async sendRentalConfirmation(
        to: string,
        kayakName: string,
        passcode: string,
        rentalEnd: Date
    ) {
        const endTime = rentalEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const message = `🛶 Kayak Rental Confirmed!\n\nKayak: ${kayakName}\nPasscode: ${passcode}\nReturn by: ${endTime}\n\nEnjoy your adventure!`;

        try {
            await this.getClient().messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            console.log(`📱 Rental SMS sent to ${to}`);
        } catch (error: any) {
            console.error('❌ Failed to send rental SMS:', error.message);
        }
    }

    async sendReturnReminder(
        to: string,
        kayakName: string,
        minutesRemaining: number
    ) {
        const message = `⏰ Reminder: Your ${kayakName} rental expires in ${minutesRemaining} minutes. Please return soon!`;

        try {
            await this.getClient().messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            console.log(`📱 Reminder SMS sent to ${to}`);
        } catch (error: any) {
            console.error('❌ Failed to send reminder SMS:', error.message);
        }
    }

    async sendReturnConfirmation(
        to: string,
        kayakName: string
    ) {
        const message = `✅ Thank you for returning ${kayakName}! We hope you enjoyed your kayaking experience.`;

        try {
            await this.getClient().messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            console.log(`📱 Return SMS sent to ${to}`);
        } catch (error: any) {
            console.error('❌ Failed to send return SMS:', error.message);
        }
    }
}

export default new SMSService();
