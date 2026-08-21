export function fitDialogPosition(x, y, width, height, bounds) {
    const maxX = bounds.left + Math.max(0, bounds.width - width);
    const maxY = bounds.top + Math.max(0, bounds.height - height);
    return {
        x: Math.min(Math.max(x ?? 100, bounds.left), maxX),
        y: Math.min(Math.max(y ?? 100, bounds.top), maxY)
    };
}
