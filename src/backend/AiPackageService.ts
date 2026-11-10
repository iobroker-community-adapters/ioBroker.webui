import fs from 'node:fs';
import { validateAllowedPackage } from '../shared/NpmPackagePolicy.js';

// /dist/frontend is intentionally excluded from the npm package. Read the
// packaged browser allowlist, which is also the source of AI discovery.
const allowed = new Set<string>(JSON.parse(fs.readFileSync(new URL('../../www/dist/frontend/npm/usable-packages.json', import.meta.url), 'utf8')));

export interface PackageInstallResult { name: string; status: 'installed' | 'already-installed'; version: string; }
interface PackageOperations {
    busy(): boolean;
    installed(): Promise<Record<string, string>>;
    install(name: string): Promise<number>;
    publish(): Promise<void>;
    status(value: string): Promise<void>;
}

/** One atomic request, distinct from the legacy shared control-state protocol. */
export class AiPackageService {
    running = false;
    constructor(private readonly operations: PackageOperations) { }
    async add(value: unknown): Promise<PackageInstallResult> {
        const name = validateAllowedPackage(value, allowed);
        if (this.running || this.operations.busy()) throw new Error('Another npm operation is running. Retry after it finishes.');
        this.running = true;
        try {
            const before = await this.operations.installed();
            if (!before[name]) {
                await this.operations.status(`installing npm package "${name}"`);
                const exitCode = await this.operations.install(name);
                if (exitCode !== 0) throw new Error(`npm could not install ${name} (exit ${exitCode}). Check the adapter log; the package may not be published yet.`);
            }
            await this.operations.status('publishing npm widgets');
            await this.operations.publish();
            const after = await this.operations.installed();
            if (!after[name]) throw new Error('npm finished but the package is absent from package.json.');
            return { name, status: before[name] ? 'already-installed' : 'installed', version: after[name] };
        } finally {
            try { await this.operations.status('idle'); }
            finally { this.running = false; }
        }
    }
}
