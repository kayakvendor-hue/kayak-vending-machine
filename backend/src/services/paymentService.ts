import Stripe from 'stripe';

export class PaymentService {
    private stripe: Stripe | null = null;

    constructor() {
        // Lazy initialization - will be created when first used
    }

    private getStripe(): Stripe {
        if (!this.stripe) {
            const secretKey = process.env.STRIPE_SECRET_KEY;
            console.log('🔑 STRIPE_SECRET_KEY loaded:', secretKey ? `${secretKey.substring(0, 7)}...` : 'MISSING');
            if (!secretKey || secretKey.includes('your_stripe')) {
                throw new Error('STRIPE_SECRET_KEY not configured in .env file');
            }
            this.stripe = new Stripe(secretKey);
        }
        return this.stripe;
    }

    /**
     * Create a payment intent for a rental
     * @param amount - Amount in dollars (will be converted to cents)
     * @param customerEmail - Customer email for receipt
     * @param metadata - Additional metadata (rentalId, kayakId, etc.)
     */
    public async createPaymentIntent(
        amount: number, 
        customerEmail: string,
        metadata: { rentalId?: string; kayakId?: string; userId?: string }
    ): Promise<Stripe.PaymentIntent> {
        try {
            const stripe = this.getStripe();
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert dollars to cents
                currency: 'usd',
                receipt_email: customerEmail,
                metadata: metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            
            console.log(`💳 Payment intent created: ${paymentIntent.id} for $${amount}`);
            return paymentIntent;
        } catch (error: any) {
            console.error('❌ Payment intent creation failed:', error.message);
            throw new Error('Payment processing failed: ' + error.message);
        }
    }

    /**
     * Confirm a payment intent status
     */
    public async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        try {
            const stripe = this.getStripe();
            return await stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error: any) {
            throw new Error('Failed to retrieve payment: ' + error.message);
        }
    }

    /**
     * Refund a payment
     * @param paymentIntentId - The payment intent ID to refund
     * @param amount - Optional partial refund amount in dollars
     */
    public async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
        try {
            const stripe = this.getStripe();
            const refundOptions: Stripe.RefundCreateParams = {
                payment_intent: paymentIntentId
            };
            
            if (amount) {
                refundOptions.amount = Math.round(amount * 100); // Convert to cents
            }
            
            const refund = await stripe.refunds.create(refundOptions);
            console.log(`💰 Refund processed: ${refund.id} for payment ${paymentIntentId}`);
            return refund;
        } catch (error: any) {
            console.error('❌ Refund processing failed:', error.message);
            throw new Error('Refund processing failed: ' + error.message);
        }
    }

    /**
     * Create or retrieve a Stripe customer
     * @param email - Customer email
     * @param name - Customer name
     * @param metadata - Additional customer metadata
     */
    public async createCustomer(email: string, name?: string, metadata?: any): Promise<Stripe.Customer> {
        try {
            const stripe = this.getStripe();
            const customer = await stripe.customers.create({
                email,
                name,
                metadata
            });
            console.log(`👤 Stripe customer created: ${customer.id}`);
            return customer;
        } catch (error: any) {
            console.error('❌ Customer creation failed:', error.message);
            throw new Error('Customer creation failed: ' + error.message);
        }
    }

    /**
     * Attach a payment method to a customer and set as default
     * @param customerId - Stripe customer ID
     * @param paymentMethodId - Payment method ID from frontend
     */
    public async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.PaymentMethod> {
        try {
            const stripe = this.getStripe();
            
            // Attach payment method to customer
            const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });

            // Set as default payment method
            await stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });

            console.log(`💳 Payment method ${paymentMethodId} attached to customer ${customerId}`);
            return paymentMethod;
        } catch (error: any) {
            console.error('❌ Payment method attachment failed:', error.message);
            throw new Error('Payment method attachment failed: ' + error.message);
        }
    }

    /**
     * Charge a customer's saved payment method
     * @param customerId - Stripe customer ID
     * @param amount - Amount in dollars
     * @param description - Charge description
     * @param metadata - Additional metadata
     */
    public async chargeCustomer(
        customerId: string,
        amount: number,
        description: string,
        metadata?: any
    ): Promise<Stripe.PaymentIntent> {
        try {
            const stripe = this.getStripe();
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'usd',
                customer: customerId,
                description,
                metadata,
                off_session: true, // Charge without customer present
                confirm: true,
            });

            console.log(`💳 Customer charged: ${customerId} for $${amount} - ${description}`);
            return paymentIntent;
        } catch (error: any) {
            console.error('❌ Customer charge failed:', error.message);
            throw new Error('Customer charge failed: ' + error.message);
        }
    }

    /**
     * Get payment method details
     */
    public async getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
        try {
            const stripe = this.getStripe();
            return await stripe.paymentMethods.retrieve(paymentMethodId);
        } catch (error: any) {
            throw new Error('Failed to retrieve payment method: ' + error.message);
        }
    }
}

export default new PaymentService();