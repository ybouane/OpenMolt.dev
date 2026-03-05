/**
 * @module integrations/shopify
 * Shopify Admin REST API 2024-10 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const shopifyDefinition: IntegrationDefinition = {
	name: 'Shopify',
	apiSetup: {
		baseUrl: 'https://{{ config.shopDomain }}/admin/api/2024-10',
		headers: {
			'Content-Type': 'application/json',
		},
		requestFormat: 'json',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'custom',
			headers: {
				'X-Shopify-Access-Token': '{{ config.accessToken }}',
			},
		},
	],
	scopes: {
		products: 'Read and write products, variants, and collections',
		orders: 'Read and write orders and fulfillments',
		customers: 'Read and write customer records',
		inventory: 'Read and write inventory levels and items',
		fulfillments: 'Create and manage fulfillments',
	},
	tools: [
		// ── Products ─────────────────────────────────────────────────────────────

		{
			handle: 'listProducts',
			description: 'List products in the Shopify store with optional filters.',
			scopes: ['products'],
			method: 'GET',
			endpoint: '/products.json',
			queryParams: {
				limit: '{{ input.limit }}',
				page_info: '{{ input.page_info }}',
				status: '{{ input.status }}',
				vendor: '{{ input.vendor }}',
				product_type: '{{ input.product_type }}',
				collection_id: '{{ input.collection_id }}',
				title: '{{ input.title }}',
				ids: '{{ input.ids }}',
				since_id: '{{ input.since_id }}',
				created_at_min: '{{ input.created_at_min }}',
				created_at_max: '{{ input.created_at_max }}',
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(250).optional().describe('Maximum number of results to return (max 250)'),
				page_info: z.string().optional().describe('Pagination cursor for the next or previous page'),
				status: z.string().optional().describe('Filter by status: active, archived, draft'),
				vendor: z.string().optional().describe('Filter by vendor name'),
				product_type: z.string().optional().describe('Filter by product type'),
				collection_id: z.string().optional().describe('Filter by collection ID'),
				title: z.string().optional().describe('Filter by product title'),
				ids: z.string().optional().describe('Comma-separated list of product IDs to retrieve'),
				since_id: z.number().int().optional().describe('Return only products after this ID'),
				created_at_min: z.string().optional().describe('ISO 8601 minimum creation date'),
				created_at_max: z.string().optional().describe('ISO 8601 maximum creation date'),
				fields: z.string().optional().describe('Comma-separated list of fields to include in the response'),
			}),
		},

		{
			handle: 'getProduct',
			description: 'Get a single product by its ID.',
			scopes: ['products'],
			method: 'GET',
			endpoint: '/products/{{ input.id }}.json',
			queryParams: {
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				id: z.union([z.string(), z.number()]).describe('The product ID'),
				fields: z.string().optional().describe('Comma-separated list of fields to include'),
			}),
		},

		{
			handle: 'createProduct',
			description: 'Create a new product in the Shopify store.',
			scopes: ['products'],
			method: 'POST',
			endpoint: '/products.json',
			body: {
				product: {
					title: '{{ input.title }}',
					body_html: '{{ input.body_html }}',
					vendor: '{{ input.vendor }}',
					product_type: '{{ input.product_type }}',
					tags: '{{ input.tags }}',
					status: '{{ input.status }}',
					variants: '{{ input.variants }}',
					images: '{{ input.images }}',
					options: '{{ input.options }}',
				},
			},
			inputSchema: z.object({
				title: z.string().describe('Product title'),
				body_html: z.string().optional().describe('HTML description of the product'),
				vendor: z.string().optional().describe('Name of the vendor'),
				product_type: z.string().optional().describe('Product type / category'),
				tags: z.string().optional().describe('Comma-separated list of tags'),
				status: z.enum(['active', 'archived', 'draft']).optional().describe('Product status'),
				variants: z.array(z.record(z.unknown())).optional().describe('Array of product variant objects'),
				images: z.array(z.record(z.unknown())).optional().describe('Array of product image objects'),
				options: z.array(z.record(z.unknown())).optional().describe('Array of product option objects (e.g. Size, Color)'),
			}),
		},

		{
			handle: 'updateProduct',
			description: 'Update an existing product by ID.',
			scopes: ['products'],
			method: 'PUT',
			endpoint: '/products/{{ input.id }}.json',
			body: {
				product: {
					id: '{{ input.id }}',
					title: '{{ input.title }}',
					body_html: '{{ input.body_html }}',
					vendor: '{{ input.vendor }}',
					product_type: '{{ input.product_type }}',
					status: '{{ input.status }}',
					tags: '{{ input.tags }}',
					variants: '{{ input.variants }}',
				},
			},
			inputSchema: z.object({
				id: z.union([z.string(), z.number()]).describe('The product ID to update'),
				title: z.string().optional().describe('New product title'),
				body_html: z.string().optional().describe('New HTML description'),
				vendor: z.string().optional().describe('New vendor name'),
				product_type: z.string().optional().describe('New product type'),
				status: z.string().optional().describe('New status: active, archived, or draft'),
				tags: z.string().optional().describe('New comma-separated tags'),
				variants: z.array(z.record(z.unknown())).optional().describe('Updated variants array'),
			}),
		},

		{
			handle: 'deleteProduct',
			description: 'Delete a product by its ID.',
			scopes: ['products'],
			method: 'DELETE',
			endpoint: '/products/{{ input.id }}.json',
			inputSchema: z.object({
				id: z.union([z.string(), z.number()]).describe('The product ID to delete'),
			}),
		},

		// ── Orders ───────────────────────────────────────────────────────────────

		{
			handle: 'listOrders',
			description: 'List orders in the Shopify store with optional filters.',
			scopes: ['orders'],
			method: 'GET',
			endpoint: '/orders.json',
			queryParams: {
				limit: '{{ input.limit }}',
				status: '{{ input.status }}',
				financial_status: '{{ input.financial_status }}',
				fulfillment_status: '{{ input.fulfillment_status }}',
				since_id: '{{ input.since_id }}',
				created_at_min: '{{ input.created_at_min }}',
				created_at_max: '{{ input.created_at_max }}',
				fields: '{{ input.fields }}',
				page_info: '{{ input.page_info }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(250).optional().describe('Maximum number of orders to return'),
				status: z.string().optional().describe('Order status filter: open, closed, cancelled, any'),
				financial_status: z.string().optional().describe('Financial status: pending, authorized, partially_paid, paid, etc.'),
				fulfillment_status: z.string().optional().describe('Fulfillment status: shipped, partial, unshipped, etc.'),
				since_id: z.number().int().optional().describe('Return only orders after this ID'),
				created_at_min: z.string().optional().describe('ISO 8601 minimum creation date'),
				created_at_max: z.string().optional().describe('ISO 8601 maximum creation date'),
				fields: z.string().optional().describe('Comma-separated list of fields to include'),
				page_info: z.string().optional().describe('Pagination cursor'),
			}),
		},

		{
			handle: 'getOrder',
			description: 'Get a single order by its ID.',
			scopes: ['orders'],
			method: 'GET',
			endpoint: '/orders/{{ input.id }}.json',
			queryParams: {
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				id: z.union([z.string(), z.number()]).describe('The order ID'),
				fields: z.string().optional().describe('Comma-separated list of fields to include'),
			}),
		},

		{
			handle: 'updateOrder',
			description: 'Update an existing order (tags, note, email, shipping address).',
			scopes: ['orders'],
			method: 'PUT',
			endpoint: '/orders/{{ input.id }}.json',
			body: {
				order: {
					id: '{{ input.id }}',
					tags: '{{ input.tags }}',
					note: '{{ input.note }}',
					email: '{{ input.email }}',
					shipping_address: '{{ input.shipping_address }}',
				},
			},
			inputSchema: z.object({
				id: z.union([z.string(), z.number()]).describe('The order ID to update'),
				tags: z.string().optional().describe('Comma-separated list of tags'),
				note: z.string().optional().describe('Optional note for the order'),
				email: z.string().email().optional().describe('Customer email address'),
				shipping_address: z.record(z.unknown()).optional().describe('Updated shipping address object'),
			}),
		},

		{
			handle: 'cancelOrder',
			description: 'Cancel an order by its ID.',
			scopes: ['orders'],
			method: 'POST',
			endpoint: '/orders/{{ input.id }}/cancel.json',
			body: {
				amount: '{{ input.amount }}',
				reason: '{{ input.reason }}',
				email: '{{ input.email }}',
				refund: '{{ input.refund }}',
			},
			inputSchema: z.object({
				id: z.union([z.string(), z.number()]).describe('The order ID to cancel'),
				amount: z.string().optional().describe('Amount to refund (decimal string)'),
				reason: z.string().optional().describe('Reason for cancellation'),
				email: z.boolean().optional().describe('Whether to send a cancellation email to the customer'),
				refund: z.boolean().optional().describe('Whether to refund any payments'),
			}),
		},

		// ── Customers ────────────────────────────────────────────────────────────

		{
			handle: 'listCustomers',
			description: 'List customers in the Shopify store.',
			scopes: ['customers'],
			method: 'GET',
			endpoint: '/customers.json',
			queryParams: {
				limit: '{{ input.limit }}',
				since_id: '{{ input.since_id }}',
				created_at_min: '{{ input.created_at_min }}',
				created_at_max: '{{ input.created_at_max }}',
				fields: '{{ input.fields }}',
				query: '{{ input.query }}',
				page_info: '{{ input.page_info }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(250).optional().describe('Maximum number of customers to return'),
				since_id: z.number().int().optional().describe('Return only customers after this ID'),
				created_at_min: z.string().optional().describe('ISO 8601 minimum creation date'),
				created_at_max: z.string().optional().describe('ISO 8601 maximum creation date'),
				fields: z.string().optional().describe('Comma-separated list of fields to include'),
				query: z.string().optional().describe('Search query string'),
				page_info: z.string().optional().describe('Pagination cursor'),
			}),
		},

		{
			handle: 'getCustomer',
			description: 'Get a single customer by their ID.',
			scopes: ['customers'],
			method: 'GET',
			endpoint: '/customers/{{ input.id }}.json',
			queryParams: {
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				id: z.union([z.string(), z.number()]).describe('The customer ID'),
				fields: z.string().optional().describe('Comma-separated list of fields to include'),
			}),
		},

		{
			handle: 'createCustomer',
			description: 'Create a new customer record in Shopify.',
			scopes: ['customers'],
			method: 'POST',
			endpoint: '/customers.json',
			body: {
				customer: {
					first_name: '{{ input.first_name }}',
					last_name: '{{ input.last_name }}',
					email: '{{ input.email }}',
					phone: '{{ input.phone }}',
					tags: '{{ input.tags }}',
					note: '{{ input.note }}',
					addresses: '{{ input.addresses }}',
					accepts_marketing: '{{ input.accepts_marketing }}',
				},
			},
			inputSchema: z.object({
				first_name: z.string().optional().describe('Customer first name'),
				last_name: z.string().optional().describe('Customer last name'),
				email: z.string().email().optional().describe('Customer email address'),
				phone: z.string().optional().describe('Customer phone number'),
				tags: z.string().optional().describe('Comma-separated tags'),
				note: z.string().optional().describe('Internal note about the customer'),
				addresses: z.array(z.record(z.unknown())).optional().describe('Array of address objects'),
				accepts_marketing: z.boolean().optional().describe('Whether the customer accepts marketing emails'),
			}),
		},

		// ── Inventory ────────────────────────────────────────────────────────────

		{
			handle: 'listInventoryItems',
			description: 'List inventory items by their IDs.',
			scopes: ['inventory'],
			method: 'GET',
			endpoint: '/inventory_items.json',
			queryParams: {
				ids: '{{ input.ids }}',
				limit: '{{ input.limit }}',
			},
			inputSchema: z.object({
				ids: z.string().describe('Comma-separated list of inventory item IDs (required)'),
				limit: z.number().int().min(1).max(250).optional().describe('Maximum number of results to return'),
			}),
		},

		{
			handle: 'getInventoryLevel',
			description: 'Get inventory levels for inventory items and/or locations.',
			scopes: ['inventory'],
			method: 'GET',
			endpoint: '/inventory_levels.json',
			queryParams: {
				inventory_item_ids: '{{ input.inventory_item_ids }}',
				location_ids: '{{ input.location_ids }}',
				limit: '{{ input.limit }}',
			},
			inputSchema: z.object({
				inventory_item_ids: z.string().optional().describe('Comma-separated inventory item IDs'),
				location_ids: z.string().optional().describe('Comma-separated location IDs'),
				limit: z.number().int().min(1).max(250).optional().describe('Maximum number of results'),
			}),
		},

		{
			handle: 'adjustInventory',
			description: 'Adjust the available inventory level for an inventory item at a location.',
			scopes: ['inventory'],
			method: 'POST',
			endpoint: '/inventory_levels/adjust.json',
			body: {
				inventory_item_id: '{{ input.inventory_item_id }}',
				location_id: '{{ input.location_id }}',
				available_adjustment: '{{ input.available_adjustment }}',
			},
			inputSchema: z.object({
				inventory_item_id: z.number().int().describe('The inventory item ID'),
				location_id: z.number().int().describe('The location ID'),
				available_adjustment: z.number().int().describe('Positive or negative integer adjustment to apply'),
			}),
		},

		// ── Collections ──────────────────────────────────────────────────────────

		{
			handle: 'listCollections',
			description: 'List smart collections in the Shopify store.',
			scopes: ['products'],
			method: 'GET',
			endpoint: '/smart_collections.json',
			queryParams: {
				limit: '{{ input.limit }}',
				title: '{{ input.title }}',
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(250).optional().describe('Maximum number of collections to return'),
				title: z.string().optional().describe('Filter by collection title'),
				fields: z.string().optional().describe('Comma-separated list of fields to include'),
			}),
		},

		// ── Fulfillments ─────────────────────────────────────────────────────────

		{
			handle: 'createFulfillment',
			description: 'Create a fulfillment for an order.',
			scopes: ['fulfillments'],
			method: 'POST',
			endpoint: '/orders/{{ input.orderId }}/fulfillments.json',
			body: {
				fulfillment: {
					line_items: '{{ input.line_items }}',
					notify_customer: '{{ input.notify_customer }}',
					tracking_info: '{{ input.tracking_info }}',
				},
			},
			inputSchema: z.object({
				orderId: z.union([z.string(), z.number()]).describe('The order ID to fulfill'),
				line_items: z.array(z.record(z.unknown())).optional().describe('Specific line items to fulfill; omit to fulfill all'),
				notify_customer: z.boolean().optional().describe('Whether to send a shipment notification to the customer'),
				tracking_info: z.record(z.unknown()).optional().describe('Tracking info object with company, number, url'),
			}),
		},

		// ── Shop ─────────────────────────────────────────────────────────────────

		{
			handle: 'getShop',
			description: 'Get information about the Shopify store.',
			scopes: ['products'],
			method: 'GET',
			endpoint: '/shop.json',
			inputSchema: z.object({}),
		},
	],
};
