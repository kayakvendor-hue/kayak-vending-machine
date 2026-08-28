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
        rentalEnd: Date,
        rentals?: Array<{ kayakName: string }>
    ) {
        const endTime = rentalEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let message = '';
        if (rentals && rentals.length > 1) {
            const kayakList = rentals.map(r => r.kayakName).join(', ');
            message = `🛶 Rental Confirmed!\n\nKayaks: ${kayakList}\nReturn by: ${endTime}\n\nUse the unlock button in your account to access your kayaks.`;
        } else {
            message = `🛶 Rental Confirmed!\n\nKayak: ${kayakName}\nReturn by: ${endTime}\n\nUse the unlock button in your account to access your kayak.`;
        }

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

    async sendLateReturnNotification(
        to: string,
        kayakName: string,
        chargeAmount: number,
        hoursLate: number
    ) {
        const message = `⏰ Late Return Fee: $${chargeAmount.toFixed(2)} charged to ${kayakName} (${hoursLate}h late). Please return immediately to avoid further charges!`;

        try {
            await this.getClient().messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            console.log(`📱 Late return notification SMS sent to ${to}`);
        } catch (error: any) {
            console.error('❌ Failed to send late return SMS:', error.message);
        }
    }
}

export default new SMSService();
