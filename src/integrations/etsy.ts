/**
 * @module integrations/etsy
 * Etsy Open API v3 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const etsyDefinition: IntegrationDefinition = {
	name: 'Etsy',
	apiSetup: {
		baseUrl: 'https://openapi.etsy.com/v3',
		headers: {
			'x-api-key': '{{ config.apiKey }}',
			'Content-Type': 'application/json',
		},
		requestFormat: 'json',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'oauth2',
			authUrl: 'https://www.etsy.com/oauth/connect',
			tokenUrl: 'https://api.etsy.com/v3/public/oauth/token',
			clientId: '{{ config.clientId }}',
			clientSecret: '{{ config.clientSecret }}',
			refreshToken: '{{ config.refreshToken }}',
			scopes: ['listings_r', 'listings_w', 'shops_r', 'shops_w', 'transactions_r'],
		},
	],
	scopes: {
		'listings.read': 'Read listing data from Etsy shops',
		'listings.write': 'Create, update, and delete listings',
		'shops.read': 'Read shop information and settings',
		'shops.write': 'Update shop information and settings',
		'orders.read': 'Read shop receipts and orders',
	},
	tools: [
		// ── User ─────────────────────────────────────────────────────────────────

		{
			handle: 'getMe',
			description: 'Get information about the authenticated Etsy user.',
			scopes: ['shops.read'],
			method: 'GET',
			endpoint: '/application/users/me',
			inputSchema: z.object({}),
		},

		// ── Listings ─────────────────────────────────────────────────────────────

		{
			handle: 'getListing',
			description: 'Retrieve a single Etsy listing by its ID.',
			scopes: ['listings.read'],
			method: 'GET',
			endpoint: '/application/listings/{{ input.listingId }}',
			queryParams: {
				includes: '{{ input.includes }}',
			},
			inputSchema: z.object({
				listingId: z.union([z.string(), z.number()]).describe('The listing ID'),
				includes: z.array(z.string()).optional().describe('Additional resources to include (e.g. ["Images", "Videos", "MainImage"])'),
			}),
		},

		{
			handle: 'getActiveListings',
			description: 'Get all active listings for a specific Etsy shop.',
			scopes: ['listings.read'],
			method: 'GET',
			endpoint: '/application/shops/{{ input.shopId }}/listings/active',
			queryParams: {
				limit: '{{ input.limit }}',
				offset: '{{ input.offset }}',
				sort_on: '{{ input.sortOn }}',
				sort_order: '{{ input.sortOrder }}',
				keywords: '{{ input.keywords }}',
			},
			inputSchema: z.object({
				shopId: z.union([z.string(), z.number()]).describe('The shop ID'),
				limit: z.number().int().min(1).max(100).optional().describe('Number of results to return (max 100)'),
				offset: z.number().int().optional().describe('Number of results to skip'),
				sortOn: z.string().optional().describe('Field to sort on: created, price, updated, score'),
				sortOrder: z.enum(['asc', 'ascending', 'desc', 'descending', 'up', 'down']).optional().describe('Sort order'),
				keywords: z.string().optional().describe('Keywords to filter listings'),
			}),
		},

		{
			handle: 'getAllShopListings',
			description: 'Get all listings from a shop filtered by state.',
			scopes: ['listings.read'],
			method: 'GET',
			endpoint: '/application/shops/{{ input.shopId }}/listings',
			queryParams: {
				state: '{{ input.state }}',
				limit: '{{ input.limit }}',
				offset: '{{ input.offset }}',
			},
			inputSchema: z.object({
				shopId: z.union([z.string(), z.number()]).describe('The shop ID'),
				state: z.enum(['active', 'inactive', 'sold_out', 'draft', 'expired']).optional().describe('Filter by listing state'),
				limit: z.number().int().min(1).max(100).optional().describe('Number of results to return'),
				offset: z.number().int().optional().describe('Number of results to skip'),
			}),
		},

		{
			handle: 'createListing',
			description: 'Create a new listing in an Etsy shop.',
			scopes: ['listings.write'],
			method: 'POST',
			endpoint: '/application/shops/{{ input.shopId }}/listings',
			body: {
				quantity: '{{ input.quantity }}',
				title: '{{ input.title }}',
				description: '{{ input.description }}',
				price: '{{ input.price }}',
				who_made: '{{ input.whoMade }}',
				when_made: '{{ input.whenMade }}',
				taxonomy_id: '{{ input.taxonomyId }}',
				shipping_profile_id: '{{ input.shippingProfileId }}',
				return_policy_id: '{{ input.returnsPolicyId }}',
				materials: '{{ input.materials }}',
				shop_section_id: '{{ input.shopSectionId }}',
				processing_min: '{{ input.processingMin }}',
				processing_max: '{{ input.processingMax }}',
				tags: '{{ input.tags }}',
				is_supply: '{{ input.isSupply }}',
				is_customizable: '{{ input.isCustomizable }}',
				is_personalizable: '{{ input.isPersonalizable }}',
				item_weight: '{{ input.itemWeight }}',
				item_length: '{{ input.itemLength }}',
				item_width: '{{ input.itemWidth }}',
				item_height: '{{ input.itemHeight }}',
			},
			inputSchema: z.object({
				shopId: z.union([z.string(), z.number()]).describe('The shop ID to create the listing in'),
				quantity: z.number().int().min(0).describe('Number of items available for purchase'),
				title: z.string().max(140).describe('Listing title (max 140 characters)'),
				description: z.string().describe('Listing description'),
				price: z.number().positive().describe('Price of the listing (decimal)'),
				whoMade: z.string().describe('Who made the item: i_did, someone_else, collective'),
				whenMade: z.string().describe('When the item was made (e.g. "2020_2024", "made_to_order")'),
				taxonomyId: z.number().int().describe('Etsy taxonomy ID for the listing category'),
				shippingProfileId: z.number().int().optional().describe('Shipping profile ID'),
				returnsPolicyId: z.number().int().optional().describe('Returns policy ID'),
				materials: z.array(z.string()).optional().describe('Array of materials used'),
				shopSectionId: z.number().int().optional().describe('Shop section ID'),
				processingMin: z.number().int().optional().describe('Minimum processing time in days'),
				processingMax: z.number().int().optional().describe('Maximum processing time in days'),
				tags: z.array(z.string()).optional().describe('Array of tags (max 13, max 20 chars each)'),
				isSupply: z.boolean().optional().describe('Whether the item is a supply or tool'),
				isCustomizable: z.boolean().optional().describe('Whether the listing is customizable'),
				isPersonalizable: z.boolean().optional().describe('Whether the listing is personalizable'),
				itemWeight: z.number().optional().describe('Item weight (in units set in shop)'),
				itemLength: z.number().optional().describe('Item length'),
				itemWidth: z.number().optional().describe('Item width'),
				itemHeight: z.number().optional().describe('Item height'),
			}),
		},

		{
			handle: 'updateListing',
			description: 'Update an existing Etsy listing.',
			scopes: ['listings.write'],
			method: 'PATCH',
			endpoint: '/application/shops/{{ input.shopId }}/listings/{{ input.listingId }}',
			body: {
				quantity: '{{ input.quantity }}',
				title: '{{ input.title }}',
				description: '{{ input.description }}',
				price: '{{ input.price }}',
				state: '{{ input.state }}',
				tags: '{{ input.tags }}',
				materials: '{{ input.materials }}',
			},
			inputSchema: z.object({
				shopId: z.union([z.string(), z.number()]).describe('The shop ID'),
				listingId: z.union([z.string(), z.number()]).describe('The listing ID to update'),
				quantity: z.number().int().optional().describe('Updated quantity available'),
				title: z.string().optional().describe('Updated title'),
				description: z.string().optional().describe('Updated description'),
				price: z.number().positive().optional().describe('Updated price'),
				state: z.string().optional().describe('Updated state: active, inactive'),
				tags: z.array(z.string()).optional().describe('Updated tags array'),
				materials: z.array(z.string()).optional().describe('Updated materials array'),
			}),
		},

		{
			handle: 'deleteListing',
			description: 'Delete an Etsy listing by its ID.',
			scopes: ['listings.write'],
			method: 'DELETE',
			endpoint: '/application/listings/{{ input.listingId }}',
			inputSchema: z.object({
				listingId: z.union([z.string(), z.number()]).describe('The listing ID to delete'),
			}),
		},

		// ── Shop ─────────────────────────────────────────────────────────────────

		{
			handle: 'getShop',
			description: 'Retrieve information about an Etsy shop by its ID.',
			scopes: ['shops.read'],
			method: 'GET',
			endpoint: '/application/shops/{{ input.shopId }}',
			inputSchema: z.object({
				shopId: z.union([z.string(), z.number()]).describe('The shop ID'),
			}),
		},

		{
			handle: 'updateShop',
			description: 'Update shop details such as title, announcement, and policies.',
			scopes: ['shops.write'],
			method: 'PUT',
			endpoint: '/application/shops/{{ input.shopId }}',
			body: {
				title: '{{ input.title }}',
				announcement: '{{ input.announcement }}',
				sale_message: '{{ input.saleMessage }}',
				digital_sale_message: '{{ input.digitalSaleMessage }}',
				policy_welcome: '{{ input.policyWelcome }}',
				policy_payment: '{{ input.policyPayment }}',
				policy_shipping: '{{ input.policyShipping }}',
				policy_refunds: '{{ input.policyRefunds }}',
			},
			inputSchema: z.object({
				shopId: z.union([z.string(), z.number()]).describe('The shop ID to update'),
				title: z.string().optional().describe('Shop title'),
				announcement: z.string().optional().describe('Shop announcement text'),
				saleMessage: z.string().optional().describe('Sale message'),
				digitalSaleMessage: z.string().optional().describe('Digital sale message'),
				policyWelcome: z.string().optional().describe('Welcome policy text'),
				policyPayment: z.string().optional().describe('Payment policy text'),
				policyShipping: z.string().optional().describe('Shipping policy text'),
				policyRefunds: z.string().optional().describe('Returns and refunds policy text'),
			}),
		},

		// ── Inventory ────────────────────────────────────────────────────────────

		{
			handle: 'getListingInventory',
			description: 'Get the inventory details for a listing.',
			scopes: ['listings.read'],
			method: 'GET',
			endpoint: '/application/listings/{{ input.listingId }}/inventory',
			inputSchema: z.object({
				listingId: z.union([z.string(), z.number()]).describe('The listing ID'),
			}),
		},

		{
			handle: 'updateListingInventory',
			description: 'Update the inventory products, prices, and quantities for a listing.',
			scopes: ['listings.write'],
			method: 'PUT',
			endpoint: '/application/listings/{{ input.listingId }}/inventory',
			body: {
				products: '{{ input.products }}',
				price_on_property: '{{ input.priceOnProperty }}',
				quantity_on_property: '{{ input.quantityOnProperty }}',
				sku_on_property: '{{ input.skuOnProperty }}',
			},
			inputSchema: z.object({
				listingId: z.union([z.string(), z.number()]).describe('The listing ID to update inventory for'),
				products: z.array(z.record(z.unknown())).describe('Array of product objects with price, sku, and property values'),
				priceOnProperty: z.array(z.number()).optional().describe('Array of property definition IDs used to set price'),
				quantityOnProperty: z.array(z.number()).optional().describe('Array of property definition IDs used to set quantity'),
				skuOnProperty: z.array(z.number()).optional().describe('Array of property definition IDs used to set SKU'),
			}),
		},

		// ── Orders / Receipts ─────────────────────────────────────────────────────

		{
			handle: 'getShopReceipts',
			description: 'Get orders (receipts) for a shop with optional filters.',
			scopes: ['orders.read'],
			method: 'GET',
			endpoint: '/application/shops/{{ input.shopId }}/receipts',
			queryParams: {
				was_paid: '{{ input.wasPaid }}',
				was_shipped: '{{ input.wasShipped }}',
				was_delivered: '{{ input.wasDelivered }}',
				was_dispatched: '{{ input.wasDispatched }}',
				min_created: '{{ input.minCreated }}',
				max_created: '{{ input.maxCreated }}',
				limit: '{{ input.limit }}',
				offset: '{{ input.offset }}',
				sort_on: '{{ input.sortOn }}',
				sort_order: '{{ input.sortOrder }}',
			},
			inputSchema: z.object({
				shopId: z.union([z.string(), z.number()]).describe('The shop ID'),
				wasPaid: z.boolean().optional().describe('Filter to paid receipts only'),
				wasShipped: z.boolean().optional().describe('Filter to shipped receipts only'),
				wasDelivered: z.boolean().optional().describe('Filter to delivered receipts only'),
				wasDispatched: z.boolean().optional().describe('Filter to dispatched receipts only'),
				minCreated: z.number().int().optional().describe('Unix timestamp for minimum creation date'),
				maxCreated: z.number().int().optional().describe('Unix timestamp for maximum creation date'),
				limit: z.number().int().min(1).max(100).optional().describe('Number of results to return'),
				offset: z.number().int().optional().describe('Number of results to skip'),
				sortOn: z.string().optional().describe('Field to sort on: created, updated, receipt_id'),
				sortOrder: z.enum(['asc', 'ascending', 'desc', 'descending']).optional().describe('Sort direction'),
			}),
		},

		{
			handle: 'getReceipt',
			description: 'Get a single receipt (order) by shop and receipt ID.',
			scopes: ['orders.read'],
			method: 'GET',
			endpoint: '/application/shops/{{ input.shopId }}/receipts/{{ input.receiptId }}',
			inputSchema: z.object({
				shopId: z.union([z.string(), z.number()]).describe('The shop ID'),
				receiptId: z.union([z.string(), z.number()]).describe('The receipt ID'),
			}),
		},

		{
			handle: 'createReceiptShipment',
			description: 'Add tracking information to a receipt (create a shipment).',
			scopes: ['orders.read'],
			method: 'POST',
			endpoint: '/application/shops/{{ input.shopId }}/receipts/{{ input.receiptId }}/tracking_codes',
			body: {
				tracking_code: '{{ input.trackingCode }}',
				carrier_name: '{{ input.carrierId }}',
				send_bcc: '{{ input.sendBcc }}',
			},
			inputSchema: z.object({
				shopId: z.union([z.string(), z.number()]).describe('The shop ID'),
				receiptId: z.union([z.string(), z.number()]).describe('The receipt ID to ship'),
				trackingCode: z.string().describe('The tracking code for the shipment'),
				carrierId: z.string().describe('The carrier name (e.g. "usps", "fedex", "ups")'),
				sendBcc: z.boolean().optional().describe('Whether to send a BCC confirmation email'),
			}),
		},

		// ── Listing Images ────────────────────────────────────────────────────────

		{
			handle: 'getListingImages',
			description: 'Get all images for a listing.',
			scopes: ['listings.read'],
			method: 'GET',
			endpoint: '/application/listings/{{ input.listingId }}/images',
			inputSchema: z.object({
				listingId: z.union([z.string(), z.number()]).describe('The listing ID'),
			}),
		},

		// ── Search ───────────────────────────────────────────────────────────────

		{
			handle: 'searchListings',
			description: 'Search for active Etsy listings across the marketplace.',
			scopes: ['listings.read'],
			method: 'GET',
			endpoint: '/application/listings/active',
			queryParams: {
				keywords: '{{ input.keywords }}',
				sort_on: '{{ input.sortOn }}',
				sort_order: '{{ input.sortOrder }}',
				offset: '{{ input.offset }}',
				limit: '{{ input.limit }}',
				location_query: '{{ input.locationQuery }}',
				category_path: '{{ input.categoryPath }}',
				material_query: '{{ input.materialQuery }}',
				color: '{{ input.color }}',
				color_accuracy: '{{ input.colorAccuracy }}',
				shop_location: '{{ input.shopLocation }}',
				shop_name: '{{ input.shopName }}',
			},
			inputSchema: z.object({
				keywords: z.string().optional().describe('Search keywords'),
				sortOn: z.string().optional().describe('Sort field: score, created, price, price_desc, distance'),
				sortOrder: z.enum(['asc', 'ascending', 'desc', 'descending']).optional().describe('Sort direction'),
				offset: z.number().int().optional().describe('Number of results to skip'),
				limit: z.number().int().min(1).max(100).optional().describe('Number of results to return'),
				locationQuery: z.string().optional().describe('Location to filter results by'),
				categoryPath: z.string().optional().describe('Etsy category path to filter by'),
				materialQuery: z.string().optional().describe('Material to filter by'),
				color: z.string().optional().describe('Hex color string to filter by (without #)'),
				colorAccuracy: z.number().int().min(0).max(100).optional().describe('Color accuracy (0-100)'),
				shopLocation: z.string().optional().describe('Shop location to filter by'),
				shopName: z.string().optional().describe('Shop name to filter by'),
			}),
		},
	],
};
