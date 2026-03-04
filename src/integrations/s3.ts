/**
 * @module integrations/s3
 * AWS S3 (and S3-compatible) API integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const s3Definition: IntegrationDefinition = {
	name: 'AWS S3',
	credentialSetup: [
		{
			type: 'custom',
			headers: {},
		},
	],
	scopes: {
		read: 'Read objects and list buckets/objects',
		write: 'Upload, copy, and delete objects',
		admin: 'Manage bucket policies, CORS, and versioning',
	},
	tools: [
		{
			handle: 'listBuckets',
			description: 'List all S3 buckets owned by the authenticated AWS account.',
			scopes: ['read'],
			execute: async (_input, context) => {
				const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});
				const result = await client.send(new ListBucketsCommand({}));
				return { buckets: result.Buckets || [] };
			},
			inputSchema: z.object({}),
		},

		{
			handle: 'createBucket',
			description: 'Create a new S3 bucket with an optional region and ACL.',
			scopes: ['admin'],
			execute: async (input, context) => {
				const { S3Client, CreateBucketCommand } = await import('@aws-sdk/client-s3');
				const region = (input.region as string) || (context.config?.region as string) || 'us-east-1';
				const client = new S3Client({
					region,
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const params: Record<string, unknown> = {
					Bucket: input.bucketName,
				};
				if (region !== 'us-east-1') {
					params.CreateBucketConfiguration = { LocationConstraint: region };
				}
				if (input.acl) params.ACL = input.acl;

				const result = await client.send(new CreateBucketCommand(params as any));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name for the new S3 bucket'),
				region: z.string().optional().describe('AWS region for the bucket (default: from config)'),
				acl: z.string().optional().describe('Canned ACL for the bucket (e.g. private, public-read)'),
			}),
		},

		{
			handle: 'deleteBucket',
			description: 'Delete an S3 bucket. The bucket must be empty before deletion.',
			scopes: ['admin'],
			execute: async (input, context) => {
				const { S3Client, DeleteBucketCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});
				const result = await client.send(new DeleteBucketCommand({ Bucket: input.bucketName as string }));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket to delete (must be empty)'),
			}),
		},

		{
			handle: 'listObjects',
			description: 'List objects in an S3 bucket with optional prefix filtering and pagination.',
			scopes: ['read'],
			execute: async (input, context) => {
				const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const params: Record<string, unknown> = { Bucket: input.bucketName };
				if (input.prefix) params.Prefix = input.prefix;
				if (input.delimiter) params.Delimiter = input.delimiter;
				if (input.maxKeys) params.MaxKeys = input.maxKeys;
				if (input.continuationToken) params.ContinuationToken = input.continuationToken;

				const result = await client.send(new ListObjectsV2Command(params as any));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket to list objects in'),
				prefix: z.string().optional().describe('Limit results to objects whose keys begin with this prefix'),
				delimiter: z.string().optional().describe('Character used to group keys (e.g. "/" for folder-like structure)'),
				maxKeys: z.number().int().min(1).max(1000).optional().describe('Maximum number of objects to return (max 1000)'),
				continuationToken: z.string().optional().describe('Continuation token from a previous paginated response'),
			}),
		},

		{
			handle: 'getObject',
			description: 'Download an object from S3. Returns text content or base64-encoded content for binary files.',
			scopes: ['read'],
			execute: async (input, context) => {
				const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const result = await client.send(new GetObjectCommand({
					Bucket: input.bucketName as string,
					Key: input.key as string,
				}));

				const contentType = result.ContentType || '';
				const contentLength = result.ContentLength || 0;
				const isText = contentType.startsWith('text/') || contentType.includes('json') || contentType.includes('xml') || contentType.includes('javascript');

				const chunks: Uint8Array[] = [];
				if (result.Body) {
					for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
						chunks.push(chunk);
					}
				}
				const buffer = Buffer.concat(chunks);

				return {
					body: isText ? buffer.toString('utf-8') : buffer.toString('base64'),
					contentType,
					contentLength,
					encoding: isText ? 'utf-8' : 'base64',
				};
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket containing the object'),
				key: z.string().describe('Key (path) of the object to retrieve'),
			}),
		},

		{
			handle: 'putObject',
			description: 'Upload an object to an S3 bucket. The body should be a string (text or base64 for binary).',
			scopes: ['write'],
			execute: async (input, context) => {
				const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const params: Record<string, unknown> = {
					Bucket: input.bucketName,
					Key: input.key,
					Body: input.body,
				};
				if (input.contentType) params.ContentType = input.contentType;
				if (input.acl) params.ACL = input.acl;
				if (input.metadata) params.Metadata = input.metadata;
				if (input.serverSideEncryption) params.ServerSideEncryption = input.serverSideEncryption;

				const result = await client.send(new PutObjectCommand(params as any));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket to upload to'),
				key: z.string().describe('Key (path) for the uploaded object'),
				body: z.string().describe('Content to upload (text string or base64-encoded binary)'),
				contentType: z.string().optional().describe('MIME type for the object (e.g. text/plain, image/png)'),
				acl: z.string().optional().describe('Canned ACL (e.g. private, public-read, authenticated-read)'),
				metadata: z.record(z.string()).optional().describe('Key-value pairs of user-defined metadata'),
				serverSideEncryption: z.string().optional().describe('Server-side encryption algorithm (e.g. AES256, aws:kms)'),
			}),
		},

		{
			handle: 'deleteObject',
			description: 'Delete a single object from an S3 bucket.',
			scopes: ['write'],
			execute: async (input, context) => {
				const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const result = await client.send(new DeleteObjectCommand({
					Bucket: input.bucketName as string,
					Key: input.key as string,
				}));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket containing the object'),
				key: z.string().describe('Key (path) of the object to delete'),
			}),
		},

		{
			handle: 'deleteObjects',
			description: 'Delete multiple objects from an S3 bucket in a single request (max 1000).',
			scopes: ['write'],
			execute: async (input, context) => {
				const { S3Client, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const keys = input.keys as string[];
				const result = await client.send(new DeleteObjectsCommand({
					Bucket: input.bucketName as string,
					Delete: {
						Objects: keys.map((k) => ({ Key: k })),
						Quiet: false,
					},
				}));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket containing the objects'),
				keys: z.array(z.string()).max(1000).describe('Array of object keys (paths) to delete (max 1000)'),
			}),
		},

		{
			handle: 'copyObject',
			description: 'Copy an object within S3, optionally across buckets or with a new ACL.',
			scopes: ['write'],
			execute: async (input, context) => {
				const { S3Client, CopyObjectCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const params: Record<string, unknown> = {
					Bucket: input.destinationBucket,
					Key: input.destinationKey,
					CopySource: `${input.sourceBucket}/${input.sourceKey}`,
				};
				if (input.acl) params.ACL = input.acl;

				const result = await client.send(new CopyObjectCommand(params as any));
				return result;
			},
			inputSchema: z.object({
				sourceBucket: z.string().describe('Name of the source bucket'),
				sourceKey: z.string().describe('Key (path) of the source object'),
				destinationBucket: z.string().describe('Name of the destination bucket'),
				destinationKey: z.string().describe('Key (path) for the copied object in the destination bucket'),
				acl: z.string().optional().describe('Canned ACL for the copied object'),
			}),
		},

		{
			handle: 'headObject',
			description: 'Retrieve metadata about an S3 object without downloading its content.',
			scopes: ['read'],
			execute: async (input, context) => {
				const { S3Client, HeadObjectCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const result = await client.send(new HeadObjectCommand({
					Bucket: input.bucketName as string,
					Key: input.key as string,
				}));

				return {
					contentType: result.ContentType,
					contentLength: result.ContentLength,
					lastModified: result.LastModified,
					etag: result.ETag,
					metadata: result.Metadata || {},
				};
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket containing the object'),
				key: z.string().describe('Key (path) of the object to inspect'),
			}),
		},

		{
			handle: 'getPresignedUrl',
			description: 'Generate a presigned URL to grant temporary access to an S3 object for upload or download.',
			scopes: ['read'],
			execute: async (input, context) => {
				const { S3Client, GetObjectCommand, PutObjectCommand } = await import('@aws-sdk/client-s3');
				const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const operation = (input.operation as string) || 'getObject';
				const expiresIn = (input.expiresIn as number) || 3600;
				const commandParams = { Bucket: input.bucketName as string, Key: input.key as string };

				let url: string;
				if (operation === 'putObject') {
					url = await getSignedUrl(client, new PutObjectCommand(commandParams), { expiresIn });
				} else {
					url = await getSignedUrl(client, new GetObjectCommand(commandParams), { expiresIn });
				}

				return { url, expiresIn, operation };
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the S3 bucket'),
				key: z.string().describe('Key (path) of the object'),
				operation: z.enum(['getObject', 'putObject']).optional().describe('Operation for the presigned URL (default: getObject)'),
				expiresIn: z.number().int().min(1).max(604800).optional().describe('Expiry time in seconds (default: 3600, max: 604800 = 7 days)'),
			}),
		},

		{
			handle: 'listObjectVersions',
			description: 'List all versions of objects in a versioning-enabled S3 bucket.',
			scopes: ['read'],
			execute: async (input, context) => {
				const { S3Client, ListObjectVersionsCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const params: Record<string, unknown> = { Bucket: input.bucketName };
				if (input.prefix) params.Prefix = input.prefix;
				if (input.keyMarker) params.KeyMarker = input.keyMarker;
				if (input.maxKeys) params.MaxKeys = input.maxKeys;

				const result = await client.send(new ListObjectVersionsCommand(params as any));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the versioning-enabled bucket'),
				prefix: z.string().optional().describe('Limit results to keys beginning with this prefix'),
				keyMarker: z.string().optional().describe('Start listing after this key (for pagination)'),
				maxKeys: z.number().int().min(1).max(1000).optional().describe('Maximum number of versions to return'),
			}),
		},

		{
			handle: 'putBucketPolicy',
			description: 'Set or replace the bucket policy for an S3 bucket.',
			scopes: ['admin'],
			execute: async (input, context) => {
				const { S3Client, PutBucketPolicyCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const result = await client.send(new PutBucketPolicyCommand({
					Bucket: input.bucketName as string,
					Policy: input.policy as string,
				}));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket to set the policy on'),
				policy: z.string().describe('JSON string containing the bucket policy document'),
			}),
		},

		{
			handle: 'getBucketPolicy',
			description: 'Retrieve the current bucket policy for an S3 bucket.',
			scopes: ['admin'],
			execute: async (input, context) => {
				const { S3Client, GetBucketPolicyCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const result = await client.send(new GetBucketPolicyCommand({
					Bucket: input.bucketName as string,
				}));
				return { policy: result.Policy };
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket to retrieve the policy for'),
			}),
		},

		{
			handle: 'putBucketCors',
			description: 'Set the CORS configuration for an S3 bucket.',
			scopes: ['admin'],
			execute: async (input, context) => {
				const { S3Client, PutBucketCorsCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const result = await client.send(new PutBucketCorsCommand({
					Bucket: input.bucketName as string,
					CORSConfiguration: {
						CORSRules: input.corsRules as Array<{
							AllowedHeaders?: string[];
							AllowedMethods: string[];
							AllowedOrigins: string[];
							ExposeHeaders?: string[];
							MaxAgeSeconds?: number;
						}>,
					},
				}));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket to configure CORS for'),
				corsRules: z.array(z.object({
					AllowedOrigins: z.array(z.string()).describe('Allowed origin domains (use ["*"] for all)'),
					AllowedMethods: z.array(z.string()).describe('Allowed HTTP methods (e.g. GET, PUT, POST, DELETE, HEAD)'),
					AllowedHeaders: z.array(z.string()).optional().describe('Allowed request headers'),
					ExposeHeaders: z.array(z.string()).optional().describe('Response headers to expose to the browser'),
					MaxAgeSeconds: z.number().int().optional().describe('How long in seconds the browser should cache preflight results'),
				})).describe('Array of CORS rule objects'),
			}),
		},

		{
			handle: 'createMultipartUpload',
			description: 'Initiate a multipart upload session for a large file. Returns an uploadId to use with completeMultipartUpload.',
			scopes: ['write'],
			execute: async (input, context) => {
				const { S3Client, CreateMultipartUploadCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const params: Record<string, unknown> = {
					Bucket: input.bucketName,
					Key: input.key,
				};
				if (input.contentType) params.ContentType = input.contentType;

				const result = await client.send(new CreateMultipartUploadCommand(params as any));
				return { uploadId: result.UploadId, bucket: result.Bucket, key: result.Key };
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket for the multipart upload'),
				key: z.string().describe('Key (path) for the final assembled object'),
				contentType: z.string().optional().describe('MIME type for the final object'),
			}),
		},

		{
			handle: 'completeMultipartUpload',
			description: 'Complete a multipart upload by assembling previously uploaded parts.',
			scopes: ['write'],
			execute: async (input, context) => {
				const { S3Client, CompleteMultipartUploadCommand } = await import('@aws-sdk/client-s3');
				const client = new S3Client({
					region: (context.config?.region as string) || 'us-east-1',
					credentials: {
						accessKeyId: context.config?.accessKeyId as string,
						secretAccessKey: context.config?.secretAccessKey as string,
					},
					...(context.config?.endpoint ? { endpoint: context.config.endpoint as string } : {}),
				});

				const parts = input.parts as Array<{ PartNumber: number; ETag: string }>;

				const result = await client.send(new CompleteMultipartUploadCommand({
					Bucket: input.bucketName as string,
					Key: input.key as string,
					UploadId: input.uploadId as string,
					MultipartUpload: { Parts: parts },
				}));
				return result;
			},
			inputSchema: z.object({
				bucketName: z.string().describe('Name of the bucket'),
				key: z.string().describe('Key (path) of the object being assembled'),
				uploadId: z.string().describe('The upload ID returned from createMultipartUpload'),
				parts: z.array(z.object({
					PartNumber: z.number().int().min(1).max(10000).describe('Part number (1-10000)'),
					ETag: z.string().describe('ETag returned when the part was uploaded'),
				})).describe('Array of part objects in order, each with PartNumber and ETag'),
			}),
		},
	],
};
