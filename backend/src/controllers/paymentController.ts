import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import paymentService from '../services/paymentService';
import User from '../models/user';

class PaymentController {
    constructor() {
        this.createPaymentIntent = this.createPaymentIntent.bind(this);
        this.getPaymentStatus = this.getPaymentStatus.bind(this);
        this.savePaymentMethod = this.savePaymentMethod.bind(this);
        this.chargeDamage = this.chargeDamage.bind(this);
    }

    /**
     * Create a payment intent for a kayak rental
     */
    public async createPaymentIntent(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const { amount, kayakId, rentalDuration } = req.body;

        try {
            // Get user email for receipt
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            // Create payment intent
            const paymentIntent = await paymentService.createPaymentIntent(
                amount,
                user.email,
                {
                    userId: userId!,
                    kayakId
                }
            );

            res.status(200).json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            });
        } catch (error: any) {
            console.error('Error creating payment intent:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create payment intent',
                error: error.message
            });
        }
    }

    /**
     * Get payment intent status
     */
    public async getPaymentStatus(req: AuthRequest, res: Response): Promise<void> {
        const { paymentIntentId } = req.params;

        try {
            const paymentIntent = await paymentService.getPaymentIntent(paymentIntentId);
            
            res.status(200).json({
                success: true,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100, // Convert cents to dollars
                metadata: paymentIntent.metadata
            });
        } catch (error: any) {
            console.error('Error retrieving payment status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve payment status',
                error: error.message
            });
        }
    }

    /**
     * Save payment method to customer profile after successful payment
     */
    public async savePaymentMethod(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const { paymentMethodId } = req.body;

        try {
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            // Create Stripe customer if doesn't exist
            let customerId = user.stripeCustomerId;
            if (!customerId) {
                const customer = await paymentService.createCustomer(
                    user.email,
                    user.name || user.username || 'User',
                    { userId: userId }
                );
                customerId = customer.id;
            }

            // Attach payment method to customer
            const paymentMethod = await paymentService.attachPaymentMethod(customerId, paymentMethodId);

            // Save customer ID and payment method details to user
            user.stripeCustomerId = customerId;
            user.defaultPaymentMethodId = paymentMethodId;
            user.cardLast4 = paymentMethod.card?.last4;
            user.cardBrand = paymentMethod.card?.brand;
            await user.save();

            console.log(`💾 Payment method saved for user ${userId}`);

            res.status(200).json({
                success: true,
                message: 'Payment method saved',
                cardLast4: paymentMethod.card?.last4,
                cardBrand: paymentMethod.card?.brand
            });
        } catch (error: any) {
            console.error('Error saving payment method:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save payment method',
                error: error.message
            });
        }
    }

    /**
     * Charge customer for damages (admin only)
     */
    public async chargeDamage(req: AuthRequest, res: Response): Promise<void> {
        const { userId, amount, description } = req.body;

        try {
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            if (!user.stripeCustomerId || !user.defaultPaymentMethodId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'User has no saved payment method' 
                });
                return;
            }

            // Charge the customer's saved payment method
            const paymentIntent = await paymentService.chargeCustomer(
                user.stripeCustomerId,
                amount,
                description || 'Kayak damage charge',
                { userId: userId }
            );

            res.status(200).json({
                success: true,
                message: 'Damage charge processed',
                paymentIntentId: paymentIntent.id,
                amount: amount
            });
        } catch (error: any) {
            console.error('Error charging for damage:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process damage charge',
                error: error.message
            });
        }
    }
}

export default new PaymentController();
