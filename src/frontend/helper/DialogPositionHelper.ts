export interface DialogBounds {
    left: number;
    top: number;
    width: number;
    height: number;
}

export function fitDialogPosition(
    x: number | undefined,
    y: number | undefined,
    width: number,
    height: number,
    bounds: DialogBounds
): { x: number, y: number } {
    const maxX = bounds.left + Math.max(0, bounds.width - width);
    const maxY = bounds.top + Math.max(0, bounds.height - height);

    return {
        x: Math.min(Math.max(x ?? 100, bounds.left), maxX),
        y: Math.min(Math.max(y ?? 100, bounds.top), maxY)
    };
}
