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
     * Confirm payment with Stripe token (from client-side tokenization)
     * Token is created by Stripe on the client and sent to backend
     */
    public async confirmPaymentIntent(
        paymentIntentId: string,
        token?: string,
        card?: any // Legacy support for direct card objects
    ): Promise<Stripe.PaymentIntent> {
        try {
            const stripe = this.getStripe();
            
            let paymentMethodId: string;

            if (token) {
                // Token-based payment (recommended - token created on client)
                console.log('🔐 Using tokenized payment method...');
                paymentMethodId = token;
            } else if (card) {
                // For development/testing - create payment method from card
                console.log('⚠️  Creating payment method from card data...');
                
                // For testing, we can use a test token instead of raw card data
                // This avoids needing to enable raw card data APIs in Stripe dashboard
                if (card.number === '4242424242424242' || card.number === '4242 4242 4242 4242') {
                    console.log('🧪 Using Stripe test token for Visa...');
                    paymentMethodId = 'tok_visa';
                } else if (card.number === '5555555555554444' || card.number === '5555 5555 5555 4444') {
                    console.log('🧪 Using Stripe test token for Mastercard...');
                    paymentMethodId = 'tok_mastercard';
                } else {
                    // For other card numbers, try to create a payment method
                    // This requires raw card data APIs to be enabled in Stripe dashboard
                    const paymentMethod = await stripe.paymentMethods.create({
                        type: 'card',
                        card: {
                            number: card.number,
                            exp_month: card.exp_month,
                            exp_year: card.exp_year,
                            cvc: card.cvc,
                        },
                    });
                    console.log('✅ Payment method created:', paymentMethod.id);
                    paymentMethodId = paymentMethod.id;
                }
            } else {
                throw new Error('Either token or card data must be provided');
            }
            
            // Confirm the payment intent with the payment method
            const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethodId,
            });
            
            console.log(`✅ Payment confirmed: ${confirmedPayment.id} - Status: ${confirmedPayment.status}`);
            return confirmedPayment;
        } catch (error: any) {
            console.error('❌ Payment confirmation failed:', error.message);
            throw new Error('Payment confirmation failed: ' + error.message);
        }
    }

    /**
     * Create a hosted checkout session
     */
    public async createCheckoutSession(
        paymentIntentId: string,
        amount: number,
        customerEmail: string,
        successUrl: string,
        cancelUrl: string
    ): Promise<any> {
        try {
            const stripe = this.getStripe();
            
            console.log('🛒 Creating Stripe hosted checkout session...');
            
            // Create a checkout session using the payment intent
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                customer_email: customerEmail,
                payment_intent_data: {
                    setup_future_usage: 'off_session',
                },
                success_url: successUrl,
                cancel_url: cancelUrl,
            });
            
            console.log('✅ Checkout session created:', session.id);
            return session;
        } catch (error: any) {
            console.error('❌ Checkout session creation failed:', error.message);
            throw new Error('Checkout session creation failed: ' + error.message);
        }
    }

    /**
     * Create a Payment Link (official Stripe integration for mobile)
     */
    public async createPaymentLink(
        amount: number,
        customerEmail: string,
        description: string,
        metadata: any
    ): Promise<Stripe.PaymentLink> {
        try {
            const stripe = this.getStripe();
            
            console.log('🔗 Creating Stripe Payment Link for $' + amount);
            
            const paymentLink = await stripe.paymentLinks.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: description,
                            },
                            unit_amount: Math.round(amount * 100), // Convert dollars to cents
                        },
                        quantity: 1,
                    },
                ],
                metadata: metadata,
            });
            
            console.log('✅ Payment Link created:', paymentLink.url);
            return paymentLink;
        } catch (error: any) {
            console.error('❌ Payment Link creation failed:', error.message);
            throw new Error('Payment Link creation failed: ' + error.message);
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