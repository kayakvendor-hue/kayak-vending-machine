import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

class EmailService {
    private transporter: Mail | null = null;

    constructor() {
        // Lazy initialization
    }

    private getTransporter(): Mail {
        if (!this.transporter) {
            const user = process.env.EMAIL_SERVICE_USER;
            const pass = process.env.EMAIL_SERVICE_PASS;
            
            // Check if credentials are configured (not placeholder values)
            const isConfigured = user && 
                                 pass && 
                                 !user.includes('your_email@gmail.com') && 
                                 !pass.includes('your_gmail_app_password') &&
                                 pass.length > 10; // Gmail app passwords are 16 chars
            
            if (!isConfigured) {
                console.warn('⚠️ Email service not configured - emails will not be sent');
                console.warn(`   EMAIL_SERVICE_USER: ${user || 'missing'}`);
                console.warn(`   EMAIL_SERVICE_PASS: ${pass ? `${pass.substring(0, 4)}... (${pass.length} chars)` : 'missing'}`);
                return {
                    sendMail: async () => {
                        console.log('📧 Email skipped (not configured)');
                        return { messageId: 'mock' };
                    }
                } as any;
            }

            console.log(`✅ Email service configured with ${user}`);
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user, pass }
            });
        }
        return this.transporter;
    }

    async sendWaiverConfirmation(to: string, userName: string) {
        const mailOptions = {
            from: process.env.EMAIL_SERVICE_USER,
            to: to,
            subject: 'Waiver Signed - Kayak Rental',
            html: `
                <h1>Waiver Confirmation</h1>
                <p>Dear ${userName},</p>
                <p>Thank you for signing the waiver. You can now proceed to rent a kayak.</p>
                <p>Best regards,<br>Kayak Vending Machine Team</p>
            `
        };

        try {
            await this.getTransporter().sendMail(mailOptions);
            console.log(`📧 Waiver confirmation sent to ${to}`);
        } catch (error: any) {
            console.error('❌ Failed to send waiver email:', error.message);
        }
    }

    async sendRentalConfirmation(
        to: string, 
        userName: string, 
        kayakName: string, 
        rentalEnd: Date,
        amount: number,
        rentals?: Array<{ kayakName: string }>
    ) {
        const endTime = rentalEnd.toLocaleString();
        
        // Build kayak list
        let kayakList = '';
        if (rentals && rentals.length > 1) {
            kayakList = rentals.map((r, i) => `<li>${r.kayakName}</li>`).join('');
        } else {
            kayakList = `<li>${kayakName}</li>`;
        }

        const mailOptions = {
            from: process.env.EMAIL_SERVICE_USER,
            to: to,
            subject: `Your Kayak Rental Confirmation`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; }
                        .header { background: linear-gradient(135deg, #18b7a0 0%, #0d8b79 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                        .content { background: #f9f9f9; padding: 30px; }
                        .details { background: white; border-left: 4px solid #18b7a0; padding: 15px; margin: 20px 0; }
                        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
                        .label { font-weight: bold; color: #18b7a0; }
                        .passcode-section { margin: 20px 0; }
                        .passcode-label { font-size: 14px; font-weight: bold; color: #18b7a0; text-transform: uppercase; margin-bottom: 8px; }
                        .passcode { font-size: 28px; font-weight: bold; color: #18b7a0; letter-spacing: 4px; background: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center; margin: 10px 0 5px 0; font-family: monospace; }
                        .passcode-description { text-align: center; color: #666; font-size: 12px; margin: 5px 0 15px 0; }
                        .instructions { background: #fffbea; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                        .instructions h3 { color: #f57c00; margin-top: 0; }
                        .instructions ol { padding-left: 20px; }
                        .instructions li { margin: 8px 0; line-height: 1.6; }
                        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                        .warning { background: #ffe6e6; border-left: 4px solid #d9534f; padding: 15px; margin: 20px 0; }
                        .warning strong { color: #c9302c; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0;">🛶 Rental Confirmed!</h1>
                            <p style="margin: 5px 0 0 0;">Your kayak is ready to go</p>
                        </div>
                        
                        <div class="content">
                            <p>Hi ${userName},</p>
                            <p>Your kayak rental has been confirmed! Here's everything you need to know.</p>
                            
                            <div class="details">
                                <div class="detail-row">
                                    <span class="label">Kayak(s):</span>
                                </div>
                                <ul style="margin: 10px 0; padding-left: 20px;">
                                    ${kayakList}
                                </ul>
                                <div class="detail-row">
                                    <span class="label">Return by:</span>
                                    <span><strong>${endTime}</strong></span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Amount Paid:</span>
                                    <span><strong>$${amount.toFixed(2)}</strong></span>
                                </div>
                            </div>

                            <div class="instructions">
                                <h3 style="margin-top: 0;">📝 What to Do Next</h3>
                                <ol>
                                    <li>Go to the kayak vending location</li>
                                    <li>Find your kayak${rentals && rentals.length > 1 ? 's' : ''} (listed above)</li>
                                    <li>Use the unlock button in your account to unlock your kayak${rentals && rentals.length > 1 ? 's' : ''}</li>
                                    <li>Get lifevests and paddles from the storage box</li>
                                    <li>Put on a life jacket before launching</li>
                                    <li>Return all kayaks to the <strong>same location</strong> before <strong>${endTime}</strong></li>
                                </ol>
                            </div>

                            <div class="warning">
                                <strong>⏰ Important:</strong> Your passcodes will automatically expire at the end of your rental period. <strong>Late returns are charged $10 per hour.</strong>
                            </div>

                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                Have questions? Check our website or contact us for help.
                            </p>

                            <p style="margin-top: 30px;">
                                Enjoy your kayaking adventure!<br>
                                <strong>Kayak Vending Machine Team</strong>
                            </p>
                        </div>

                        <div class="footer">
                            <p style="margin: 0;">This is a confirmation email for your kayak rental. Please keep it for your records.</p>
                            <p style="margin: 10px 0 0 0;">© Kayak Vending Machine. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        try {
            await this.getTransporter().sendMail(mailOptions);
            console.log(`📧 Rental confirmation sent to ${to}`);
        } catch (error: any) {
            console.error('❌ Failed to send rental confirmation email:', error.message);
        }
    }

    async sendReturnConfirmation(
        to: string,
        userName: string,
        kayakName: string
    ) {
        const mailOptions = {
            from: process.env.EMAIL_SERVICE_USER,
            to: to,
            subject: `Kayak Returned - ${kayakName}`,
            html: `
                <h1>🛶 Kayak Return Confirmation</h1>
                <p>Dear ${userName},</p>
                <p>Thank you for returning <strong>${kayakName}</strong>!</p>
                
                <p>We hope you enjoyed your kayaking experience.</p>
                <p>We look forward to seeing you again soon!</p>

                <p>Best regards,<br>Kayak Vending Machine Team</p>
            `
        };

        try {
            await this.getTransporter().sendMail(mailOptions);
            console.log(`📧 Return confirmation sent to ${to}`);
        } catch (error: any) {
            console.error('❌ Failed to send return confirmation email:', error.message);
        }
    }

    async sendPasswordResetEmail(
        to: string,
        userName: string,
        resetUrl: string
    ) {
        const mailOptions = {
            from: process.env.EMAIL_SERVICE_USER,
            to: to,
            subject: 'Password Reset Request - Kayak Vending Machine',
            html: `
                <h1>🔐 Password Reset Request</h1>
                <p>Dear ${userName},</p>
                <p>You requested to reset your password for your Kayak Vending Machine account.</p>
                
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>

                <p>Or copy and paste this link into your browser:</p>
                <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
                    ${resetUrl}
                </p>

                <p><strong>This link will expire in 1 hour.</strong></p>

                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

                <p>Best regards,<br>Kayak Vending Machine Team</p>
            `
        };

        try {
            await this.getTransporter().sendMail(mailOptions);
            console.log(`📧 Password reset email sent to ${to}`);
        } catch (error: any) {
            console.error('❌ Failed to send password reset email:', error.message);
            throw error; // Re-throw so controller can handle it
        }
    }

    async sendLateReturnNotification(
        to: string,
        userName: string,
        kayakName: string,
        chargeAmount: number,
        hoursLate: number,
        timeUntilNextCharge: Date
    ) {
        const nextChargeTime = timeUntilNextCharge.toLocaleString();
        const mailOptions = {
            from: process.env.EMAIL_SERVICE_USER,
            to: to,
            subject: `⏰ Late Return Fee Charged - ${kayakName}`,
            html: `
                <h1>Late Return Charge</h1>
                <p>Dear ${userName},</p>
                <p>Your kayak <strong>${kayakName}</strong> was returned <strong>${hoursLate} hour(s) late</strong>.</p>
                
                <div style="background-color: #ffe6e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Late Return Fee: $${chargeAmount.toFixed(2)}</strong></p>
                    <p style="font-size: 12px; color: #666;">Rate: $10 per hour</p>
                </div>

                <p>This charge has been applied to your account.</p>
                
                <p style="color: #d9534f; font-weight: bold;">
                    ⚠️ Additional charges will be applied if the kayak remains unreturned.
                </p>

                <p>To avoid further charges, please return the kayak as soon as possible.</p>
                
                <p>Questions? Contact us immediately.</p>
                <p>Best regards,<br>Kayak Vending Machine Team</p>
            `
        };

        try {
            await this.getTransporter().sendMail(mailOptions);
            console.log(`📧 Late return notification sent to ${to}`);
        } catch (error: any) {
            console.error('❌ Failed to send late return email:', error.message);
        }
    }
}

export default new EmailService();