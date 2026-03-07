/**
 * Node.js preload script (--require) that patches Docusaurus's SSG machinery
 * for Node 22 compatibility without touching node_modules.
 *
 * Problems fixed (Docusaurus 3.x / Node 22):
 *
 *  1. `require.resolveWeak` — ssgRequireFunction only copies .resolve / .cache /
 *     .extensions / .main, not webpack's resolveWeak extension.
 *
 *  2. @theme/* virtual modules — webpack aliases resolved at compile time;
 *     if any leak to runtime require() they crash with ERR_MODULE_NOT_FOUND.
 *
 *  3. CSS files — Node 22's loadESMFromCJS path ignores Module._extensions,
 *     so .css imports inside ESM-syntax files crash with ERR_UNKNOWN_FILE_EXTENSION.
 *
 *  4. @generated/* modules — webpack aliases for .docusaurus/ generated files;
 *     the server bundle may require() them at runtime without a real package.
 *
 * Fix: wrap createSSGRequire in the module cache so every require it returns
 * gets all shims applied before it is handed to the bundle.
 */
const path = require('path');
const Module = require('module');

// CJS path: stub .css and .md requires to empty objects.
Module._extensions['.css'] = function (module) {
	module.exports = {};
};
Module._extensions['.md'] = function (module) {
	module.exports = {};
};
Module._extensions['.mdx'] = function (module) {
	module.exports = {};
};

const ssgNodeRequirePath = require.resolve(
	'@docusaurus/core/lib/ssg/ssgNodeRequire.js',
);
const original = require(ssgNodeRequirePath);

Module._cache[ssgNodeRequirePath].exports = {
	createSSGRequire(serverBundlePath) {
		const result = original.createSSGRequire(serverBundlePath);

		// Derive the site's .docusaurus/ dir from the server bundle path.
		// serverBundlePath → .../website/build/__server/server.bundle.js
		// two levels up    → .../website/
		const siteDir = path.resolve(path.dirname(serverBundlePath), '../..');
		const generatedDir = path.join(siteDir, '.docusaurus');

		// 1. resolveWeak shim.
		if (!result.require.resolveWeak) {
			result.require.resolveWeak = function (id) {
				try { return result.require.resolve(id); } catch (_) { return undefined; }
			};
		}

		const inner = result.require;

		const wrapped = function (id) {
			// 4a. @generated/* → resolve to real .docusaurus/ files.
			if (id.startsWith('@generated/')) {
				const realPath = path.join(generatedDir, id.slice('@generated/'.length));
				return inner(realPath);
			}

			// 4b. @site/* → resolve to the Docusaurus siteDir.
			if (id.startsWith('@site/')) {
				const realPath = path.join(siteDir, id.slice('@site/'.length));
				return inner(realPath);
			}

			try {
				return inner(id);
			} catch (e) {
				// 2 & 3. Stub webpack virtual aliases and CSS files that escape into
				// runtime require():
				//  - @theme/* modules are webpack aliases; no real package exists.
				//  - .css files: Node 22 ESM loader rejects them (ERR_UNKNOWN_FILE_EXTENSION).
				//  - Transitive: a JS file whose ESM imports hit the above cases will
				//    surface the error even though `id` is the outer file.
				const isThemeModule = id.startsWith('@theme/');
				const isCssModule = id.endsWith('.css');
				const causedByTheme = e.code === 'ERR_MODULE_NOT_FOUND' &&
					typeof e.message === 'string' && e.message.includes("'@theme/");
				const causedByCss = e.code === 'ERR_UNKNOWN_FILE_EXTENSION' &&
					typeof e.message === 'string' && e.message.includes('.css');

				if (isThemeModule || isCssModule || causedByTheme || causedByCss) {
					if (isCssModule || causedByCss) return {};   // CSS → empty object
					const stub = function () {};
					stub.default = stub;
					return stub;
				}
				throw e;
			}
		};

		wrapped.resolve = inner.resolve;
		wrapped.cache = inner.cache;
		wrapped.extensions = inner.extensions;
		wrapped.main = inner.main;
		wrapped.resolveWeak = inner.resolveWeak;
		result.require = wrapped;

		return result;
	},
};
