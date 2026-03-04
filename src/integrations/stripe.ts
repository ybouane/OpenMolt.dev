/**
 * @module integrations/stripe
 * Stripe API v1 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

/** Encode a plain object as an x-www-form-urlencoded string, supporting nested objects/arrays. */
function toFormEncoded(obj: Record<string, unknown>, prefix = ''): string {
	const params = new URLSearchParams();

	function flatten(value: unknown, key: string): void {
		if (value === null || value === undefined) return;
		if (Array.isArray(value)) {
			value.forEach((item, idx) => flatten(item, `${key}[${idx}]`));
		} else if (typeof value === 'object') {
			Object.entries(value as Record<string, unknown>).forEach(([k, v]) => flatten(v, `${key}[${k}]`));
		} else {
			params.append(key, String(value));
		}
	}

	Object.entries(obj).forEach(([k, v]) => flatten(v, prefix ? `${prefix}[${k}]` : k));
	return params.toString();
}

function stripeHeaders(context: ToolContext): Record<string, string> {
	const config = context.config ?? {};
	return {
		Authorization: `Bearer ${config.apiKey ?? ''}`,
		'Content-Type': 'application/x-www-form-urlencoded',
		'Stripe-Version': '2024-06-20',
	};
}

const STRIPE_BASE = 'https://api.stripe.com/v1';

export const stripeDefinition: IntegrationDefinition = {
	name: 'Stripe',
	apiSetup: {
		baseUrl: STRIPE_BASE,
		headers: {
			Authorization: 'Bearer {{ config.apiKey }}',
			'Stripe-Version': '2024-06-20',
		},
		requestFormat: 'form-data',
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
				created: z.record(z.unknown()).optional().describe('Filter by creation timestamp (e.g. {gte: 1680000000})'),
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
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id: _id, ...fields } = input;
				const response = await fetch(`${STRIPE_BASE}/customers`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields as Record<string, unknown>),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe createCustomer failed (${response.status}): ${err}`);
				}
				return response.json();
			},
			inputSchema: z.object({
				email: z.string().email().optional().describe('Customer email address'),
				name: z.string().optional().describe('Customer full name'),
				phone: z.string().optional().describe('Customer phone number'),
				description: z.string().optional().describe('Internal description of the customer'),
				address: z.record(z.unknown()).optional().describe('Customer address object'),
				metadata: z.record(z.string()).optional().describe('Set of key-value pairs for metadata'),
			}),
		},

		{
			handle: 'updateCustomer',
			description: 'Update an existing Stripe customer.',
			scopes: ['write'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id, ...fields } = input as Record<string, unknown>;
				const response = await fetch(`${STRIPE_BASE}/customers/${id}`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe updateCustomer failed (${response.status}): ${err}`);
				}
				return response.json();
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
				created: z.record(z.unknown()).optional().describe('Filter by creation timestamp'),
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
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id: _id, ...fields } = input;
				const response = await fetch(`${STRIPE_BASE}/payment_intents`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields as Record<string, unknown>),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe createPaymentIntent failed (${response.status}): ${err}`);
				}
				return response.json();
			},
			inputSchema: z.object({
				amount: z.number().int().describe('Amount in the smallest currency unit (e.g. cents)'),
				currency: z.string().length(3).describe('Three-letter ISO 4217 currency code (e.g. usd)'),
				customer: z.string().optional().describe('Existing customer ID to associate'),
				description: z.string().optional().describe('Description of the payment'),
				metadata: z.record(z.string()).optional().describe('Metadata key-value pairs'),
				payment_method_types: z.array(z.string()).optional().describe('List of payment method types (e.g. ["card"])'),
				automatic_payment_methods: z.record(z.unknown()).optional().describe('Automatic payment method configuration'),
				confirm: z.boolean().optional().describe('Whether to confirm the PaymentIntent immediately'),
				receipt_email: z.string().email().optional().describe('Email for the receipt'),
			}),
		},

		{
			handle: 'confirmPaymentIntent',
			description: 'Confirm a Stripe PaymentIntent to attempt the payment.',
			scopes: ['write'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id, ...fields } = input as Record<string, unknown>;
				const response = await fetch(`${STRIPE_BASE}/payment_intents/${id}/confirm`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe confirmPaymentIntent failed (${response.status}): ${err}`);
				}
				return response.json();
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
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id, ...fields } = input as Record<string, unknown>;
				const response = await fetch(`${STRIPE_BASE}/payment_intents/${id}/cancel`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe cancelPaymentIntent failed (${response.status}): ${err}`);
				}
				return response.json();
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
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id: _id, ...fields } = input;
				const response = await fetch(`${STRIPE_BASE}/products`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields as Record<string, unknown>),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe createProduct failed (${response.status}): ${err}`);
				}
				return response.json();
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
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id: _id, ...fields } = input;
				const response = await fetch(`${STRIPE_BASE}/prices`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields as Record<string, unknown>),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe createPrice failed (${response.status}): ${err}`);
				}
				return response.json();
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
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id: _id, ...fields } = input;
				const response = await fetch(`${STRIPE_BASE}/refunds`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields as Record<string, unknown>),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe createRefund failed (${response.status}): ${err}`);
				}
				return response.json();
			},
			inputSchema: z.object({
				charge: z.string().optional().describe('Charge ID to refund (ch_...)'),
				payment_intent: z.string().optional().describe('PaymentIntent ID to refund (pi_...)'),
				amount: z.number().int().optional().describe('Amount to refund in smallest currency unit; omit to refund the full charge'),
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
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id: _id, ...fields } = input;
				const response = await fetch(`${STRIPE_BASE}/checkout/sessions`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields as Record<string, unknown>),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe createCheckoutSession failed (${response.status}): ${err}`);
				}
				return response.json();
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
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { id: _id, ...fields } = input;
				const response = await fetch(`${STRIPE_BASE}/webhook_endpoints`, {
					method: 'POST',
					headers: stripeHeaders(context),
					body: toFormEncoded(fields as Record<string, unknown>),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Stripe createWebhookEndpoint failed (${response.status}): ${err}`);
				}
				return response.json();
			},
			inputSchema: z.object({
				url: z.string().url().describe('The URL to deliver webhook events to'),
				enabled_events: z.array(z.string()).describe('List of event types to subscribe to (e.g. ["payment_intent.succeeded"])'),
				description: z.string().optional().describe('Optional description for the webhook endpoint'),
			}),
		},
	],
};
