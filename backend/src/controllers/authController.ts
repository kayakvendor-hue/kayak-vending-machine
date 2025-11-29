import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { validateSignup, validateLogin } from '../utils/validators';
import { AuthRequest } from '../middleware/auth';

class AuthController {
    async signup(req: Request, res: Response) {
        try {
            const { error } = validateSignup(req.body);
            if (error) return res.status(400).json({ success: false, message: error.details[0].message });

            // Check if user already exists
            const existingUser = await User.findOne({ email: req.body.email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already registered' });
            }

            // Hash the password before saving
            // The number 10 is the "salt rounds" - higher = more secure but slower
            // 10 is a good balance for most apps
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            // Create user with hashed password
            const user = new User({
                ...req.body,
                password: hashedPassword
            });
            await user.save();
            
            res.status(201).json({ success: true, message: 'User registered successfully' });
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

            // Use bcrypt to compare the plain password with the hashed one
            // bcrypt.compare automatically handles the hashing and comparison
            const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
            
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            // Generate JWT token with user ID and email
            // Token expires in 7 days
            const token = jwt.sign(
                { userId: user._id, email: user.email },
                process.env.JWT_SECRET as string,
                { expiresIn: '7d' }
            );

            res.status(200).json({ 
                success: true, 
                message: 'Login successful', 
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    waiverSigned: user.waiverSigned,
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

            res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    waiverSigned: user.waiverSigned
                }
            });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || 'Failed to get profile' });
        }
    }

    async updateProfile(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            const { name, phone, username } = req.body;

            // Check if username is being changed and if it's already taken
            if (username) {
                const existingUser = await User.findOne({ username, _id: { $ne: userId } });
                if (existingUser) {
                    return res.status(400).json({ success: false, message: 'Username already taken' });
                }
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { 
                    name: name || undefined, 
                    phone: phone || undefined,
                    username: username || undefined
                },
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    waiverSigned: user.waiverSigned
                }
            });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || 'Failed to update profile' });
        }
    }
}

export default new AuthController();