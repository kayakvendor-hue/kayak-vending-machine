import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../models/user';
import emailService from '../services/emailService';

class PasswordResetController {
    // Request password reset - sends email with reset link
    public async requestReset(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            if (!email) {
                res.status(400).json({ success: false, message: 'Email is required' });
                return;
            }

            // Find user by email
            const user = await User.findOne({ email: email.toLowerCase() });
            
            if (!user) {
                // Don't reveal if email exists or not for security
                res.status(200).json({ 
                    success: true, 
                    message: 'If that email exists, a password reset link has been sent.' 
                });
                return;
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Save hashed token and expiration (1 hour from now)
            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
            await user.save();

            // Create reset URL
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

            // Send email
            try {
                await emailService.sendPasswordResetEmail(
                    user.email,
                    user.name || user.username,
                    resetUrl
                );
                
                console.log(`📧 Password reset email sent to ${user.email}`);
                res.status(200).json({ 
                    success: true, 
                    message: 'If that email exists, a password reset link has been sent.' 
                });
            } catch (emailError) {
                console.error('Error sending password reset email:', emailError);
                // Clear the reset token if email fails
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                await user.save();
                
                res.status(500).json({ 
                    success: false, 
                    message: 'Error sending password reset email. Please try again.' 
                });
            }
        } catch (error) {
            console.error('Error in requestReset:', error);
            res.status(500).json({ success: false, message: 'Server error. Please try again.' });
        }
    }

    // Verify reset token
    public async verifyResetToken(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.params;

            if (!token) {
                res.status(400).json({ success: false, message: 'Invalid reset token' });
                return;
            }

            // Hash the token to compare with stored hash
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // Find user with valid token
            const user = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Invalid or expired reset token' 
                });
                return;
            }

            res.status(200).json({ 
                success: true, 
                message: 'Valid reset token',
                email: user.email 
            });
        } catch (error) {
            console.error('Error in verifyResetToken:', error);
            res.status(500).json({ success: false, message: 'Server error. Please try again.' });
        }
    }

    // Reset password with token
    public async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.params;
            const { password } = req.body;

            if (!token || !password) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Token and new password are required' 
                });
                return;
            }

            if (password.length < 6) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Password must be at least 6 characters' 
                });
                return;
            }

            // Hash the token to compare with stored hash
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // Find user with valid token
            const user = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Invalid or expired reset token' 
                });
                return;
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update password and clear reset token
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            console.log(`🔐 Password reset successful for ${user.email}`);

            res.status(200).json({ 
                success: true, 
                message: 'Password has been reset successfully. You can now log in with your new password.' 
            });
        } catch (error) {
            console.error('Error in resetPassword:', error);
            res.status(500).json({ success: false, message: 'Server error. Please try again.' });
        }
    }
}

export default new PasswordResetController();
