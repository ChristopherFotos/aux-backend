// Replace if using a different env file or config
const querystring = require('querystring');
require('dotenv').config({ path: './.env' });
const express = require('express');
const app = express();
const { resolve } = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const aux = require('./auxRoutes');
const spotifyRouter = require('./spotify');
const stripeRouter = require('./stripe');
const { default: axios } = require('axios');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.use('/aux', aux);
app.use('/spotify', spotifyRouter);
app.use('/stripe', stripeRouter);
app.use(cors());

app.use(express.static(process.env.STATIC_DIR));
// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
	if (req.originalUrl === '/webhook') {
		next();
	} else {
		bodyParser.json()(req, res, next);
	}
});

app.post('/create-payment-intent', async (req, res) => {
	const { paymentMethodType, currency, description } = req.body;

	try {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: 1999,
			currency: currency,
			payment_method_types: [paymentMethodType],
			description,
		});
		res.json({ clientSecret: paymentIntent });
	} catch (e) {
		res.status(400).json({ error: { message: e.message } });
	}
});

app.get('/', (req, res) => {
	const path = resolve(process.env.STATIC_DIR + '/index.html');
	res.sendFile(path);
});

// Stripe requires the raw body to construct the event
app.post(
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

			axios
				.post('http://localhost:4242/spotify/add-song', {
					uri: paymentIntent.description.split(' ')[0],
					room: paymentIntent.description.split(' ')[1],
				})
				.catch((e) => console.log(e));
		}

		// Return a response to acknowledge receipt of the event
		res.json({ received: true });
	}
);

app.get('/config', async (req, res) => {
	res.send(process.env.STRIPE_PUBLISHABLE_KEY);
});

app.post('/test', (req, res) => {
	console.log(req.body);

	axios
		.get(`https://jsonplaceholder.typicode.com/users/1/${req.body.resource}`)
		.then((data) => res.json(data.data))
		.catch(() => console.log('there was an error'));
});

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));
