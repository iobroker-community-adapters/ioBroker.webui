import { validateAllowedPackage } from '../../shared/NpmPackagePolicy.js';
import names from './usable-packages.json' with { type: 'json' };
import descriptions from './package-catalog.json' with { type: 'json' };

export interface PackageComponent {
    tag: string;
    properties?: { name: string; type?: string; attribute?: string; default?: string }[];
    attributes?: string[];
    events?: string[];
    slots?: string[];
}
export interface PackageDescription {
    name: string;
    description: string;
    repository: string;
    sources: string[];
    reviewedOn: string;
    registryVersionAtReview: string | null;
    notes: string;
    components: PackageComponent[];
}
export const packageCatalog = descriptions as PackageDescription[];
const allowed = new Set<string>(names);

/** Exact allowlist membership excludes URLs, versions, flags and shell fragments. */
export function allowedPackageName(name: unknown): string {
    return validateAllowedPackage(name, allowed);
}
export function describePackage(name: unknown, tag?: unknown) {
    const entry = packageCatalog.find(entry => entry.name === allowedPackageName(name));
    if (!entry) throw new Error('This package needs a catalog description before the AI can use it.');
    if (tag !== undefined) {
        if (typeof tag !== 'string') throw new Error('tag must be a string');
        const component = entry.components.find(component => component.tag === tag);
        if (!component) throw new Error('Unknown component tag in this package');
        return { ...entry, components: [component] };
    }
    return { ...entry, components: entry.components.map(({ tag }) => ({ tag })) };
}
export function findPackages(query = '') {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return packageCatalog.filter(entry => allowed.has(entry.name) && words.every(word => `${entry.name} ${entry.description} ${entry.components.map(c => c.tag).join(' ')}`.toLowerCase().includes(word)))
        .map(({ name, description, components, notes }) => ({ name, description, componentCount: components.length, sampleTags: components.slice(0, 12).map(component => component.tag), notes }));
}
