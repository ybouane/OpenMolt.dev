/**
 * @module integrations/stripe
 * Stripe API v1 integration definition.
 * All write operations use url-encoded request format (Stripe's standard).
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const stripeDefinition: IntegrationDefinition = {
	name: 'Stripe',
	instructions: `
### API Keys & Modes
- Use a **test-mode** key (\`sk_test_...\`) during development and **live-mode** (\`sk_live_...\`) for production. The objects in each mode are completely isolated — a test customer does not exist in live.

### Amounts Are in Minor Units
- All monetary values are integers in the smallest currency unit: **cents** for USD/EUR, **yen** for JPY (no decimals), etc. \`$10.00\` → \`1000\`. \`¥500\` → \`500\`.
- \`currency\` is a three-letter ISO code, lowercase (e.g. \`usd\`, \`eur\`, \`gbp\`).

### IDs
- Every object has a prefix: \`cus_\` customers, \`pi_\` payment intents, \`prod_\` products, \`price_\` prices, \`ch_\` charges, \`in_\` invoices, \`sub_\` subscriptions, \`re_\` refunds, \`cs_\` checkout sessions.

### Pagination
- List endpoints return \`{ data: [...], has_more: true/false }\`. To fetch the next page, pass \`starting_after\` set to the \`id\` of the last item in \`data\`. \`ending_before\` walks backwards. Max \`limit\` is 100.

### Payment Intent Flow
1. \`createPaymentIntent\` with \`amount\`, \`currency\`, optionally \`customer\` and \`payment_method\`. Returns a PI with \`client_secret\`.
2. If collecting card details client-side, the frontend uses \`client_secret\` with Stripe.js to confirm. Server-side confirmation uses \`confirmPaymentIntent\` with a \`payment_method\` ID (e.g. \`pm_card_visa\` in test mode).
3. Check \`status\`: \`succeeded\`, \`requires_action\` (3DS), \`requires_payment_method\` (failed — retry with a new method), \`processing\`.

### Checkout Sessions (Hosted Checkout)
- For low-code payments, prefer \`createCheckoutSession\`. Provide \`line_items\` with either existing \`price\` IDs or inline \`price_data\`, \`mode\` (\`payment\`, \`subscription\`, \`setup\`), and \`success_url\`/\`cancel_url\`. Redirect the user to the returned \`url\`.

### Products & Prices
- A **Product** is the thing being sold; a **Price** is how much it costs. You can attach multiple prices to one product (monthly/yearly, different currencies). For recurring billing, set \`recurring[interval]\` = \`month\`/\`year\` on the price.

### Refunds
- Refund a charge or a payment_intent. Omit \`amount\` for a full refund, or specify a partial amount in minor units.

### Webhooks
- \`createWebhookEndpoint\` registers a URL to receive events. Store the returned \`secret\` — it is shown once and used to verify \`Stripe-Signature\` headers on incoming webhooks.

### Nested & Array Params (url-encoded)
- Stripe expects PHP-style bracket notation for nested data: \`metadata[order_id]=123\`, \`line_items[0][price]=price_abc\`, \`line_items[0][quantity]=2\`. Tools generally handle this shape for you via the input schema.

### Idempotency
- For any create call that might be retried, include an \`Idempotency-Key\` header (a UUID you generate). Stripe will return the original response for duplicate keys within 24h, preventing double-charges.
`,
	apiSetup: {
		baseUrl: 'https://api.stripe.com/v1',
		headers: {
			'Stripe-Version': '2024-06-20',
		},
		requestFormat: 'url-encoded',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'bearer',
			headers: {
				Authorization: 'Bearer {{ config.apiKey }}',
			},
		},
	],
	scopes: {
		read: 'Read customers, payment intents, products, prices, invoices, and charges',
		write: 'Create and update customers, payment intents, products, prices, and refunds',
		checkout: 'Create Checkout Sessions and manage subscriptions',
	},
	tools: [
		// ── Customers ────────────────────────────────────────────────────────────

		{
			handle: 'listCustomers',
			description: 'List Stripe customers with optional filters for email and pagination cursors.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/customers',
			queryParams: {
				limit: '{{ input.limit }}',
				starting_after: '{{ input.starting_after }}',
				ending_before: '{{ input.ending_before }}',
				email: '{{ input.email }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(100).optional().describe('Number of customers to return (max 100)'),
				starting_after: z.string().optional().describe('Cursor: return results after this customer ID'),
				ending_before: z.string().optional().describe('Cursor: return results before this customer ID'),
				email: z.string().optional().describe('Filter by exact email address'),
			}),
		},

		{
			handle: 'getCustomer',
			description: 'Retrieve a Stripe customer by ID.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/customers/{{ input.id }}',
			inputSchema: z.object({
				id: z.string().describe('The Stripe customer ID (cus_...)'),
			}),
		},

		{
			handle: 'createCustomer',
			description: 'Create a new Stripe customer.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/customers',
			body: {
				email: '{{ input.email }}',
				name: '{{ input.name }}',
				phone: '{{ input.phone }}',
				description: '{{ input.description }}',
				metadata: '{{ input.metadata }}',
			},
			inputSchema: z.object({
				email: z.string().email().optional().describe('Customer email address'),
				name: z.string().optional().describe('Customer full name'),
				phone: z.string().optional().describe('Customer phone number'),
				description: z.string().optional().describe('Internal description of the customer'),
				metadata: z.record(z.string()).optional().describe('Set of key-value pairs for metadata'),
			}),
		},

		{
			handle: 'updateCustomer',
			description: 'Update an existing Stripe customer.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/customers/{{ input.id }}',
			body: {
				email: '{{ input.email }}',
				name: '{{ input.name }}',
				description: '{{ input.description }}',
				metadata: '{{ input.metadata }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The Stripe customer ID to update'),
				email: z.string().email().optional().describe('New email address'),
				name: z.string().optional().describe('New name'),
				description: z.string().optional().describe('New description'),
				metadata: z.record(z.string()).optional().describe('Updated metadata key-value pairs'),
			}),
		},

		{
			handle: 'deleteCustomer',
			description: 'Permanently delete a Stripe customer.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/customers/{{ input.id }}',
			inputSchema: z.object({
				id: z.string().describe('The Stripe customer ID to delete'),
			}),
		},

		// ── Payment Intents ───────────────────────────────────────────────────────

		{
			handle: 'listPaymentIntents',
			description: 'List Stripe PaymentIntents with optional filters.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/payment_intents',
			queryParams: {
				limit: '{{ input.limit }}',
				starting_after: '{{ input.starting_after }}',
				customer: '{{ input.customer }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(100).optional().describe('Number of results to return'),
				starting_after: z.string().optional().describe('Cursor: return results after this PaymentIntent ID'),
				customer: z.string().optional().describe('Filter by customer ID'),
			}),
		},

		{
			handle: 'getPaymentIntent',
			description: 'Retrieve a PaymentIntent by ID.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/payment_intents/{{ input.id }}',
			inputSchema: z.object({
				id: z.string().describe('The PaymentIntent ID (pi_...)'),
			}),
		},

		{
			handle: 'createPaymentIntent',
			description: 'Create a Stripe PaymentIntent to collect a payment.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/payment_intents',
			body: {
				amount: '{{ input.amount }}',
				currency: '{{ input.currency }}',
				customer: '{{ input.customer }}',
				description: '{{ input.description }}',
				metadata: '{{ input.metadata }}',
				payment_method_types: '{{ input.payment_method_types }}',
				confirm: '{{ input.confirm }}',
				receipt_email: '{{ input.receipt_email }}',
			},
			inputSchema: z.object({
				amount: z.number().int().describe('Amount in the smallest currency unit (e.g. cents)'),
				currency: z.string().length(3).describe('Three-letter ISO 4217 currency code (e.g. usd)'),
				customer: z.string().optional().describe('Existing customer ID to associate'),
				description: z.string().optional().describe('Description of the payment'),
				metadata: z.record(z.string()).optional().describe('Metadata key-value pairs'),
				payment_method_types: z.array(z.string()).optional().describe('List of payment method types (e.g. ["card"])'),
				confirm: z.boolean().optional().describe('Whether to confirm the PaymentIntent immediately'),
				receipt_email: z.string().email().optional().describe('Email for the receipt'),
			}),
		},

		{
			handle: 'confirmPaymentIntent',
			description: 'Confirm a Stripe PaymentIntent to attempt the payment.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/payment_intents/{{ input.id }}/confirm',
			body: {
				payment_method: '{{ input.payment_method }}',
				return_url: '{{ input.return_url }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The PaymentIntent ID to confirm'),
				payment_method: z.string().optional().describe('Payment method ID to use'),
				return_url: z.string().url().optional().describe('URL to redirect the customer after payment'),
			}),
		},

		{
			handle: 'cancelPaymentIntent',
			description: 'Cancel a Stripe PaymentIntent that has not yet been confirmed.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/payment_intents/{{ input.id }}/cancel',
			body: {
				cancellation_reason: '{{ input.cancellation_reason }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The PaymentIntent ID to cancel'),
				cancellation_reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer', 'abandoned']).optional().describe('Reason for cancellation'),
			}),
		},

		// ── Products ─────────────────────────────────────────────────────────────

		{
			handle: 'listProducts',
			description: 'List Stripe products.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/products',
			queryParams: {
				limit: '{{ input.limit }}',
				active: '{{ input.active }}',
				starting_after: '{{ input.starting_after }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(100).optional().describe('Number of products to return'),
				active: z.boolean().optional().describe('Filter to only active or inactive products'),
				starting_after: z.string().optional().describe('Cursor for pagination'),
			}),
		},

		{
			handle: 'createProduct',
			description: 'Create a new Stripe product.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/products',
			body: {
				name: '{{ input.name }}',
				description: '{{ input.description }}',
				active: '{{ input.active }}',
				metadata: '{{ input.metadata }}',
				images: '{{ input.images }}',
			},
			inputSchema: z.object({
				name: z.string().describe('Product name'),
				description: z.string().optional().describe('Product description'),
				active: z.boolean().optional().describe('Whether the product is active'),
				metadata: z.record(z.string()).optional().describe('Metadata key-value pairs'),
				images: z.array(z.string().url()).optional().describe('Array of image URLs'),
			}),
		},

		// ── Prices ───────────────────────────────────────────────────────────────

		{
			handle: 'listPrices',
			description: 'List Stripe prices, optionally filtered by product, currency, or active status.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/prices',
			queryParams: {
				limit: '{{ input.limit }}',
				product: '{{ input.product }}',
				active: '{{ input.active }}',
				currency: '{{ input.currency }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(100).optional().describe('Number of prices to return'),
				product: z.string().optional().describe('Filter by product ID'),
				active: z.boolean().optional().describe('Filter to only active or inactive prices'),
				currency: z.string().optional().describe('Filter by three-letter currency code'),
			}),
		},

		{
			handle: 'createPrice',
			description: 'Create a new Stripe price for a product.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/prices',
			body: {
				product: '{{ input.product }}',
				unit_amount: '{{ input.unit_amount }}',
				currency: '{{ input.currency }}',
				recurring: '{{ input.recurring }}',
				metadata: '{{ input.metadata }}',
			},
			inputSchema: z.object({
				product: z.string().describe('The product ID this price belongs to'),
				unit_amount: z.number().int().describe('Price in the smallest currency unit'),
				currency: z.string().length(3).describe('Three-letter ISO 4217 currency code'),
				recurring: z.record(z.unknown()).optional().describe('Recurring billing configuration (e.g. {interval: "month"})'),
				metadata: z.record(z.string()).optional().describe('Metadata key-value pairs'),
			}),
		},

		// ── Refunds ──────────────────────────────────────────────────────────────

		{
			handle: 'createRefund',
			description: 'Create a refund for a charge or payment intent.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/refunds',
			body: {
				charge: '{{ input.charge }}',
				payment_intent: '{{ input.payment_intent }}',
				amount: '{{ input.amount }}',
				reason: '{{ input.reason }}',
				metadata: '{{ input.metadata }}',
			},
			inputSchema: z.object({
				charge: z.string().optional().describe('Charge ID to refund (ch_...)'),
				payment_intent: z.string().optional().describe('PaymentIntent ID to refund (pi_...)'),
				amount: z.number().int().optional().describe('Amount to refund; omit to refund the full charge'),
				reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional().describe('Reason for the refund'),
				metadata: z.record(z.string()).optional().describe('Metadata key-value pairs'),
			}),
		},

		// ── Invoices ─────────────────────────────────────────────────────────────

		{
			handle: 'listInvoices',
			description: 'List Stripe invoices with optional filters.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/invoices',
			queryParams: {
				limit: '{{ input.limit }}',
				customer: '{{ input.customer }}',
				status: '{{ input.status }}',
				starting_after: '{{ input.starting_after }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(100).optional().describe('Number of invoices to return'),
				customer: z.string().optional().describe('Filter by customer ID'),
				status: z.string().optional().describe('Filter by invoice status: draft, open, paid, uncollectible, void'),
				starting_after: z.string().optional().describe('Cursor for pagination'),
			}),
		},

		{
			handle: 'getInvoice',
			description: 'Retrieve a Stripe invoice by ID.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/invoices/{{ input.id }}',
			inputSchema: z.object({
				id: z.string().describe('The invoice ID (in_...)'),
			}),
		},

		// ── Checkout ─────────────────────────────────────────────────────────────

		{
			handle: 'createCheckoutSession',
			description: 'Create a Stripe Checkout Session for payment, subscription, or setup mode.',
			scopes: ['checkout'],
			method: 'POST',
			endpoint: '/checkout/sessions',
			body: {
				mode: '{{ input.mode }}',
				success_url: '{{ input.success_url }}',
				cancel_url: '{{ input.cancel_url }}',
				line_items: '{{ input.line_items }}',
				customer: '{{ input.customer }}',
				customer_email: '{{ input.customer_email }}',
				payment_method_types: '{{ input.payment_method_types }}',
				metadata: '{{ input.metadata }}',
			},
			inputSchema: z.object({
				mode: z.enum(['payment', 'subscription', 'setup']).describe('The mode of the Checkout Session'),
				success_url: z.string().url().describe('URL to redirect the customer after a successful payment'),
				cancel_url: z.string().url().describe('URL to redirect the customer if they cancel'),
				line_items: z.array(z.record(z.unknown())).optional().describe('Array of line item objects with price and quantity'),
				customer: z.string().optional().describe('Existing customer ID to pre-fill'),
				customer_email: z.string().email().optional().describe('Customer email to pre-fill if no customer ID'),
				payment_method_types: z.array(z.string()).optional().describe('List of accepted payment method types'),
				metadata: z.record(z.string()).optional().describe('Metadata key-value pairs'),
			}),
		},

		// ── Subscriptions ─────────────────────────────────────────────────────────

		{
			handle: 'listSubscriptions',
			description: 'List Stripe subscriptions with optional filters.',
			scopes: ['checkout'],
			method: 'GET',
			endpoint: '/subscriptions',
			queryParams: {
				limit: '{{ input.limit }}',
				customer: '{{ input.customer }}',
				status: '{{ input.status }}',
				price: '{{ input.price }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(100).optional().describe('Number of subscriptions to return'),
				customer: z.string().optional().describe('Filter by customer ID'),
				status: z.string().optional().describe('Filter by status: active, canceled, incomplete, past_due, trialing, unpaid'),
				price: z.string().optional().describe('Filter by price ID'),
			}),
		},

		// ── Balance ──────────────────────────────────────────────────────────────

		{
			handle: 'getBalance',
			description: 'Retrieve the current Stripe account balance.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/balance',
			inputSchema: z.object({}),
		},

		// ── Charges ──────────────────────────────────────────────────────────────

		{
			handle: 'retrieveCharge',
			description: 'Retrieve a Stripe charge by ID.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/charges/{{ input.id }}',
			inputSchema: z.object({
				id: z.string().describe('The charge ID (ch_...)'),
			}),
		},

		// ── Webhook Endpoints ─────────────────────────────────────────────────────

		{
			handle: 'createWebhookEndpoint',
			description: 'Register a new webhook endpoint to receive Stripe events.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/webhook_endpoints',
			body: {
				url: '{{ input.url }}',
				enabled_events: '{{ input.enabled_events }}',
				description: '{{ input.description }}',
			},
			inputSchema: z.object({
				url: z.string().url().describe('The URL to deliver webhook events to'),
				enabled_events: z.array(z.string()).describe('List of event types to subscribe to (e.g. ["payment_intent.succeeded"])'),
				description: z.string().optional().describe('Optional description for the webhook endpoint'),
			}),
		},
	],
};
