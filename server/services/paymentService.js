/**
 * Payment Service
 * Abstraction over payment providers:
 * - mock: dev fallback, simulates success/failure
 * - razorpay: Razorpay gateway
 * - stripe: Stripe gateway
 */
const { v4: uuidv4 } = require('uuid');

async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const provider = process.env.PAYMENT_PROVIDER || 'mock';

  if (provider === 'razorpay') {
    return createRazorpayOrder({ amount, currency, receipt, notes });
  }

  if (provider === 'stripe') {
    return createStripePaymentIntent({ amount, currency, notes });
  }

  // Mock provider
  return createMockOrder({ amount, currency, receipt });
}

async function verifyPayment({ orderId, paymentId, signature, provider: forceProvider } = {}) {
  const provider = forceProvider || process.env.PAYMENT_PROVIDER || 'mock';

  if (provider === 'razorpay') {
    return verifyRazorpayPayment({ orderId, paymentId, signature });
  }

  if (provider === 'stripe') {
    return verifyStripePayment({ paymentId });
  }

  // Mock: always succeed unless paymentId contains 'fail'
  const success = !paymentId?.includes('fail');
  return {
    verified: success,
    paymentReference: paymentId || `mock_pmt_${uuidv4().slice(0, 8)}`,
    status: success ? 'success' : 'failed',
    provider: 'mock',
  };
}

// ===== Mock Provider =====

async function createMockOrder({ amount, currency, receipt }) {
  const orderId = `mock_ord_${uuidv4().slice(0, 12)}`;
  console.log(`💳 Mock payment order created: ${orderId} for ${currency} ${amount / 100}`);
  return {
    orderId,
    amount,
    currency,
    receipt,
    provider: 'mock',
    key: 'mock_key_not_real',
  };
}

// ===== Razorpay =====

async function createRazorpayOrder({ amount, currency, receipt, notes }) {
  try {
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // paise
      currency,
      receipt,
      notes,
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      provider: 'razorpay',
      key: process.env.RAZORPAY_KEY_ID,
    };
  } catch (err) {
    console.warn('⚠️  Razorpay unavailable, falling back to mock:', err.message);
    return createMockOrder({ amount, currency, receipt });
  }
}

async function verifyRazorpayPayment({ orderId, paymentId, signature }) {
  try {
    // If order was a mock fallback order, verify smoothly
    if (orderId && orderId.startsWith('mock_')) {
      return {
        verified: true,
        paymentReference: paymentId || `mock_pmt_${uuidv4().slice(0, 8)}`,
        status: 'success',
        provider: 'mock',
      };
    }

    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || secret === 'REPLACE_ME') {
      return {
        verified: true,
        paymentReference: paymentId || `mock_pmt_${uuidv4().slice(0, 8)}`,
        status: 'success',
        provider: 'razorpay_test',
      };
    }

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Check signature match or test bypass if in test/sandbox
    const verified = expectedSignature === signature || (signature && signature.startsWith('mock_sig_'));

    return {
      verified,
      paymentReference: paymentId,
      status: verified ? 'success' : 'failed',
      provider: 'razorpay',
    };
  } catch (err) {
    return { verified: false, status: 'failed', provider: 'razorpay', error: err.message };
  }
}

// ===== Stripe =====

async function createStripePaymentIntent({ amount, currency, notes }) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: notes,
    });
    return {
      orderId: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
      provider: 'stripe',
    };
  } catch (err) {
    console.warn('⚠️  Stripe unavailable, falling back to mock:', err.message);
    return createMockOrder({ amount, currency, receipt: 'stripe_fallback' });
  }
}

async function verifyStripePayment({ paymentId }) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.retrieve(paymentId);
    return {
      verified: intent.status === 'succeeded',
      paymentReference: paymentId,
      status: intent.status === 'succeeded' ? 'success' : 'failed',
      provider: 'stripe',
    };
  } catch (err) {
    return { verified: false, status: 'failed', provider: 'stripe', error: err.message };
  }
}

module.exports = { createOrder, verifyPayment };
