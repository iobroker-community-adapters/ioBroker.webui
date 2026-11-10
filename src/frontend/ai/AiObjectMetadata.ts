export function objectMetadata(object: ioBroker.AnyObject | null) {
    if (!object) return null;
    const common = {};
    for (const key of ['name', 'desc', 'type', 'role', 'read', 'write', 'unit', 'min', 'max', 'step', 'states', 'def', 'members']) {
        if (object.common?.[key] !== undefined) common[key] = object.common[key];
    }
    return { id: object._id, type: object.type, common };
}

