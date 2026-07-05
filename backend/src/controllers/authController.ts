import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import Rental from '../models/rental';
import { validateSignup, validateLogin } from '../utils/validators';
import { AuthRequest } from '../middleware/auth';
import { getUserWaiverState } from '../utils/waiverStatus';

class AuthController {
    async signup(req: Request, res: Response) {
        try {
            const { error } = validateSignup(req.body);
            if (error) return res.status(400).json({ success: false, message: error.details[0].message });

            const existingUser = await User.findOne({ email: req.body.email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already registered' });
            }

            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const user = new User({
                ...req.body,
                password: hashedPassword
            });
            await user.save();

            return res.status(201).json({ success: true, message: 'User registered successfully' });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || 'Signup failed' });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { error } = validateLogin(req.body);
            if (error) return res.status(400).json({ success: false, message: error.details[0].message });

            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const isPasswordValid = await bcrypt.compare(req.body.password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const waiverState = await getUserWaiverState(String(user._id));

            const token = jwt.sign(
                { userId: user._id, email: user.email },
                process.env.JWT_SECRET as string,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    waiverSigned: waiverState.signed,
                    waiverSignedAt: waiverState.signedAt,
                    waiverExpiresAt: waiverState.expiresAt,
                    isAdmin: user.isAdmin || false
                }
            });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || 'Login failed' });
        }
    }

    async getProfile(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            const user = await User.findById(userId).select('-password');
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const waiverState = await getUserWaiverState(String(user._id));
            const rentalHistory = await Rental.find({ userId }).populate('kayakId').sort({ createdAt: -1 }).limit(10);

            res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    waiverSigned: waiverState.signed,
                    waiverSignedAt: waiverState.signedAt,
                    waiverExpiresAt: waiverState.expiresAt,
                    isWaiverExpired: waiverState.isExpired,
                },
                rentalHistory
            });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || 'Failed to get profile' });
        }
    }

    async updateProfile(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            const { name, phone, username, currentPassword, newPassword } = req.body;

            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({ success: false, message: 'Current password is required to change your password' });
                }

                if (String(newPassword).length < 6) {
                    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
                }
            }

            // Check if username is being changed and if it's already taken
            if (username) {
                const existingUser = await User.findOne({ username, _id: { $ne: userId } });
                if (existingUser) {
                    return res.status(400).json({ success: false, message: 'Username already taken' });
                }
            }

            const existingUser = await User.findById(userId);
            if (!existingUser) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (newPassword) {
                const isCurrentPasswordValid = await bcrypt.compare(String(currentPassword), existingUser.password);
                if (!isCurrentPasswordValid) {
                    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
                }
            }

            const updatePayload: Record<string, unknown> = {
                name: name || undefined,
                phone: phone || undefined,
                username: username || undefined,
            };

            if (newPassword) {
                updatePayload.password = await bcrypt.hash(String(newPassword), 10);
            }

            const user = await User.findByIdAndUpdate(
                userId,
                updatePayload,
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const waiverState = await getUserWaiverState(String(user._id));

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    waiverSigned: waiverState.signed,
                    waiverSignedAt: waiverState.signedAt,
                    waiverExpiresAt: waiverState.expiresAt,
                    isWaiverExpired: waiverState.isExpired,
                }
            });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || 'Failed to update profile' });
        }
    }
}

export default new AuthController();