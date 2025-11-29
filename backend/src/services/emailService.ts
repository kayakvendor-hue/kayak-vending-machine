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
        passcode: string,
        rentalEnd: Date,
        amount: number
    ) {
        const endTime = rentalEnd.toLocaleString();
        const mailOptions = {
            from: process.env.EMAIL_SERVICE_USER,
            to: to,
            subject: `Your Kayak Rental Confirmation - ${kayakName}`,
            html: `
                <h1>🛶 Kayak Rental Confirmation</h1>
                <p>Dear ${userName},</p>
                <p>Your kayak rental has been confirmed!</p>
                
                <h2>Rental Details:</h2>
                <ul>
                    <li><strong>Kayak:</strong> ${kayakName}</li>
                    <li><strong>Passcode:</strong> <span style="font-size: 24px; font-weight: bold; color: #007bff;">${passcode}</span></li>
                    <li><strong>Return by:</strong> ${endTime}</li>
                    <li><strong>Amount Paid:</strong> $${amount.toFixed(2)}</li>
                </ul>

                <h2>Instructions:</h2>
                <ol>
                    <li>Use the passcode <strong>${passcode}</strong> to unlock the kayak</li>
                    <li>Return the kayak by <strong>${endTime}</strong></li>
                    <li>Lock the kayak when you return it</li>
                </ol>

                <p><strong>Important:</strong> Your passcode will expire automatically at the end of your rental period.</p>

                <p>Enjoy your kayaking adventure!</p>
                <p>Best regards,<br>Kayak Vending Machine Team</p>
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
}

export default new EmailService();