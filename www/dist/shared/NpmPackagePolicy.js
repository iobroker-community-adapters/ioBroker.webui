/** Exact membership excludes versions, URLs, flags and shell fragments. */
export function validateAllowedPackage(name, allowed) {
    if (typeof name !== 'string' || !allowed.has(name))
        throw new Error('Choose an exact package name from list_packages; versions, URLs and other packages are not supported.');
    return name;
}
