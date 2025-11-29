import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Rental from '../models/rental';
import User from '../models/user';
import Kayak from '../models/kayak';

class AdminController {
    // Get all rentals with user and kayak details
    async getAllRentals(req: AuthRequest, res: Response) {
        try {
            const rentals = await Rental.find()
                .populate('userId', 'username email name phone')
                .populate('kayakId')
                .sort({ createdAt: -1 });
            
            res.status(200).json({ success: true, rentals });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching rentals', error });
        }
    }

    // Get active rentals (not yet returned)
    async getActiveRentals(req: AuthRequest, res: Response) {
        try {
            const rentals = await Rental.find({ 
                returnPhotoUrl: { $in: [null, '', undefined] }
            })
                .populate('userId', 'username email name phone')
                .populate('kayakId')
                .sort({ rentalEnd: 1 });
            
            res.status(200).json({ success: true, rentals });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching active rentals', error });
        }
    }

    // Get dashboard statistics
    async getStats(req: AuthRequest, res: Response) {
        try {
            // Total rentals
            const totalRentals = await Rental.countDocuments();
            
            // Active rentals (not returned yet)
            const activeRentals = await Rental.countDocuments({ 
                returnPhotoUrl: { $in: [null, '', undefined] }
            });

            // Total users
            const totalUsers = await User.countDocuments();

            // Total kayaks and available kayaks
            const totalKayaks = await Kayak.countDocuments();
            const availableKayaks = await Kayak.countDocuments({ isAvailable: true });

            // Revenue calculations (aggregate payment amounts)
            const revenueData = await Rental.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { 
                            $sum: { 
                                $divide: [
                                    { 
                                        $subtract: [
                                            { $toLong: '$rentalEnd' }, 
                                            { $toLong: '$rentalStart' }
                                        ]
                                    }, 
                                    3600000 // Convert milliseconds to hours
                                ]
                            }
                        }
                    }
                }
            ]);

            // Simplified revenue calculation - count rentals by duration
            const allRentals = await Rental.find().select('rentalStart rentalEnd');
            let totalRevenue = 0;
            
            // Tiered pricing
            const pricing: { [key: number]: number } = {
                1: 10, 2: 18, 4: 32, 8: 50
            };

            allRentals.forEach((rental: any) => {
                const hours = Math.round((rental.rentalEnd.getTime() - rental.rentalStart.getTime()) / (1000 * 3600));
                totalRevenue += pricing[hours] || hours * 10;
            });

            // Get recent activity (last 7 days)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentRentals = await Rental.countDocuments({
                createdAt: { $gte: sevenDaysAgo }
            });

            res.status(200).json({
                success: true,
                stats: {
                    totalRentals,
                    activeRentals,
                    totalUsers,
                    totalKayaks,
                    availableKayaks,
                    totalRevenue: totalRevenue.toFixed(2),
                    recentRentals
                }
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ success: false, message: 'Error fetching statistics', error });
        }
    }

    // Get all users
    async getAllUsers(req: AuthRequest, res: Response) {
        try {
            const users = await User.find()
                .select('-password')
                .sort({ createdAt: -1 });
            
            res.status(200).json({ success: true, users });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching users', error });
        }
    }

    // Update kayak availability (manual override)
    async updateKayakAvailability(req: AuthRequest, res: Response) {
        try {
            const { kayakId, isAvailable } = req.body;
            
            const kayak = await Kayak.findByIdAndUpdate(
                kayakId,
                { isAvailable },
                { new: true }
            );

            if (!kayak) {
                return res.status(404).json({ success: false, message: 'Kayak not found' });
            }

            res.status(200).json({ success: true, message: 'Kayak availability updated', kayak });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error updating kayak', error });
        }
    }
}

export default new AdminController();
