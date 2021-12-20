require('dotenv').config({ path: './.env' });
const router = require('express').Router();
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/create-payment-intent', async (req, res) => {
	const { paymentMethodType, currency } = req.body;

	try {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: 1999,
			currency: currency,
			payment_method_types: [paymentMethodType],
		});
		res.json({ clientSecret: paymentIntent.client_secret });
	} catch (e) {
		res.status(400).json({ error: { message: e.message } });
	}
});

router.post(
	'/webhook',
	bodyParser.raw({ type: 'application/json' }),
	(req, res) => {
		const sig = req.headers['stripe-signature'];

		let event;

		try {
			event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
		} catch (err) {
			// On error, log and return the error message
			console.log(`❌ Error message: ${err.message}`);
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

		// Successfully constructed event
		if (event.type === 'payment_intent.created') {
			const paymentIntent = event.data.object;
			console.log(
				`✅ [${event.id}] PaymentIntent (${paymentIntent.id}): `,
				paymentIntent
			);
		}

		// Return a response to acknowledge receipt of the event
		res.json({ received: true });
	}
);

router.get('/config', async (req, res) => {
	res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

module.exports = router;
