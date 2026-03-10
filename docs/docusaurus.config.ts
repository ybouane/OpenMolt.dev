import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
	title: 'OpenMolt',
	tagline: 'Programmatic AI Agent System',
	favicon: 'img/logo.png',

	url: 'https://openmolt.dev',
	baseUrl: '/docs/',

	onBrokenLinks: 'warn',
	onBrokenMarkdownLinks: 'warn',

	i18n: {
		defaultLocale: 'en',
		locales: ['en'],
	},

	plugins: [
		function docusaurusAutoModuleType() {
			return {
				name: 'docusaurus-auto-module-type',
				configureWebpack() {
					return {
						module: {
							rules: [
								{
									// .docusaurus/ generated files use mixed CJS+ESM syntax.
									// With "type":"module" in the root package.json, webpack 5
									// treats them as strict ESM and leaves require() calls
									// unbundled (externals with absolute filesystem paths).
									// Force javascript/auto so webpack bundles require() targets.
									include: /\.docusaurus[/\\].*\.js$/,
									type: 'javascript/auto',
								},
							],
						},
					};
				},
			};
		},
	],

	presets: [
		[
			'classic',
			{
				docs: {
					sidebarPath: './sidebars.ts',
					routeBasePath: '/',
				},
				blog: false,
				theme: {
					customCss: './src/css/custom.css',
				},
			} satisfies Preset.Options,
		],
	],

	themeConfig: {
		colorMode: {
			defaultMode: 'dark',
			respectPrefersColorScheme: true,
		},
		navbar: {
			title: 'OpenMolt',
			logo: {
				alt: 'OpenMolt Logo',
				src: 'img/logo.png',
			},
			items: [
				{
					type: 'docSidebar',
					sidebarId: 'docs',
					position: 'left',
					label: 'Docs',
				},
				{
					href: 'https://github.com/ybouane/openmolt.dev',
					label: 'GitHub',
					position: 'right',
				},
				{
					href: 'https://www.npmjs.com/package/openmolt',
					label: 'npm',
					position: 'right',
				},
			],
		},
		footer: {
			style: 'dark',
			links: [
				{
					title: 'Documentation',
					items: [
						{ label: 'Getting Started', to: '/getting-started' },
						{ label: 'Concepts', to: '/concepts/agents' },
						{ label: 'Examples', to: '/examples/overview' },
						{ label: 'API Reference', to: '/api/' },
					],
				},
				{
					title: 'Community',
					items: [
						{ label: 'GitHub', href: 'https://github.com/ybouane/openmolt' },
						{ label: 'npm', href: 'https://www.npmjs.com/package/openmolt' },
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} OpenMolt. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ['typescript', 'bash', 'json'],
		},
		algolia: undefined,
	} satisfies Preset.ThemeConfig,
};

export default config;
