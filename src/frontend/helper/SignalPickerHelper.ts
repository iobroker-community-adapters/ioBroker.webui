/** Route an asynchronous picker result through the field's normal binding event. */
export async function pickSignalForInput(input: HTMLInputElement, pick: (selected: string) => Promise<string | null | undefined>): Promise<boolean> {
    const selected = await pick(input.value);
    // Rows can be removed/rebuilt while the external selector is open.
    if (!selected || !input.isConnected) return false;
    input.value = selected;
    input.dispatchEvent(new input.ownerDocument.defaultView.Event('input', { bubbles: true }));
    return true;
}
