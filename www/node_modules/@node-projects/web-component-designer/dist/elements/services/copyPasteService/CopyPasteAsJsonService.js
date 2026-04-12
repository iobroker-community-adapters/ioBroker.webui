import { DomConverter } from "../../widgets/designerView/DomConverter.js";
import { copyToClipboard, getFromClipboard, getTextFromClipboard } from "../../helper/ClipboardHelper.js";
import { DesignItem } from "../../item/DesignItem.js";
import { filterChildPlaceItems } from "../../helper/LayoutHelper.js";
export class CopyPasteAsJsonService {
    async copyItems(designItems) {
        const items = filterChildPlaceItems(designItems);
        const copyText = DomConverter.ConvertToString(items, false);
        const positions = items.map(x => x.instanceServiceContainer.designerCanvas.getNormalizedElementCoordinates(x.element));
        const data = { html: copyText, positions: positions };
        copyToClipboard([["text/html", copyText], ["text/plain", copyText], ["application/json", JSON.stringify(data)]]);
    }
    async getPasteItems(serviceContainer, instanceServiceContainer) {
        const pasteData = await this._readClipboardPasteData();
        if (pasteData.imageData) {
            let di = await DesignItem.createDesignItemFromImageBlob(serviceContainer, instanceServiceContainer, pasteData.imageData);
            return [[di]];
        }
        const parserService = serviceContainer.htmlParserService;
        return [await parserService.parse(pasteData.html, serviceContainer, instanceServiceContainer, true), pasteData.positions ?? undefined];
    }
    async _readClipboardPasteData() {
        let html = '';
        let positions = null;
        let imageData = null;
        const items = await getFromClipboard();
        if (items != null) {
            const clipboardItem = items[0];
            const jsonData = await this._tryReadClipboardType(clipboardItem, 'application/json');
            if (jsonData) {
                const parsedJson = this._parseJsonClipboardData(jsonData);
                html = parsedJson?.html ?? '';
                positions = parsedJson?.positions ?? null;
            }
            if (!html) {
                html = await this._tryReadClipboardType(clipboardItem, 'text/html') ?? '';
            }
            if (!html) {
                html = await this._tryReadClipboardType(clipboardItem, 'text/plain') ?? '';
            }
            try {
                let imageFmt = clipboardItem.types.find(x => x.startsWith("image/"));
                if (imageFmt) {
                    imageData = await clipboardItem.getType(imageFmt);
                }
            }
            catch { }
        }
        else {
            html = await getTextFromClipboard();
        }
        return { html, positions, imageData };
    }
    _parseJsonClipboardData(data) {
        try {
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async _tryReadClipboardType(item, type) {
        try {
            return await (await item.getType(type))?.text();
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=CopyPasteAsJsonService.js.map