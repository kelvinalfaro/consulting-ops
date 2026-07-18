import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Load built-in providers and untracked local provider plugins. */
export async function loadProviderPlugins(roots = ['providers', 'plugins.local']) {
  const providers = new Map();
  const origins = new Map();
  for (const root of roots.map((value) => resolve(value))) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      let file = null;
      if (entry.isFile() && entry.name.endsWith('.mjs') && !entry.name.startsWith('_')) {
        file = join(root, entry.name);
      } else if (entry.isDirectory() && existsSync(join(root, entry.name, 'provider.mjs'))) {
        file = join(root, entry.name, 'provider.mjs');
      }
      if (!file) continue;
      const module = await import(pathToFileURL(file).href);
      const provider = module.default;
      if (provider?.id && typeof provider.fetch === 'function') {
        if (providers.has(provider.id)) {
          throw new Error(`Duplicate discovery provider id "${provider.id}" in ${origins.get(provider.id)} and ${file}`);
        }
        providers.set(provider.id, provider);
        origins.set(provider.id, file);
      }
    }
  }
  return providers;
}

export function resolveProvider(providers, type) {
  return providers.get(type) ?? null;
}
