export interface PackageInstallResult {
    name: string;
    status: 'installed' | 'already-installed';
    version: string;
}
interface PackageOperations {
    busy(): boolean;
    installed(): Promise<Record<string, string>>;
    install(name: string): Promise<number>;
    publish(): Promise<void>;
    status(value: string): Promise<void>;
}
/** One atomic request, distinct from the legacy shared control-state protocol. */
export declare class AiPackageService {
    private readonly operations;
    running: boolean;
    constructor(operations: PackageOperations);
    add(value: unknown): Promise<PackageInstallResult>;
}
export {};
