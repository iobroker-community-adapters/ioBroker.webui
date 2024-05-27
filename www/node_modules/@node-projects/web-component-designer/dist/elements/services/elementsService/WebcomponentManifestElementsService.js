import { removeLeading, removeTrailing } from "../../helper/Helper.js";
export class WebcomponentManifestElementsService {
    _name;
    get name() { return this._name; }
    _importPrefix;
    _elementList;
    _resolveStored;
    _rejectStored;
    constructor(name, importPrefix, manifest) {
        this._name = name;
        this._importPrefix = importPrefix;
        this._parseManifest(manifest);
    }
    _parseManifest(manifest) {
        this._elementList = [];
        for (let m of manifest.modules) {
            for (let e of m.exports) {
                if (e.kind == 'custom-element-definition') {
                    let elDef = { tag: e.name, import: removeTrailing(this._importPrefix, '/') + '/' + removeLeading(m.path, '/'), defaultWidth: "200px", defaultHeight: "200px", className: e.declaration.name };
                    this._elementList.push(elDef);
                }
            }
            for (let d of m.declarations) {
                if (d.tagName) {
                    let elDef = { tag: d.tagName, import: removeTrailing(this._importPrefix, '/') + '/' + removeLeading(m.path, '/'), defaultWidth: "200px", defaultHeight: "200px", className: d.name };
                    this._elementList.push(elDef);
                }
            }
            if (this._resolveStored) {
                this._resolveStored.forEach(x => x(this._elementList));
                this._resolveStored = null;
                this._rejectStored = null;
            }
        }
    }
    async getElements() {
        if (this._elementList)
            return Promise.resolve(this._elementList);
        if (!this._resolveStored) {
            this._resolveStored = [];
            this._rejectStored = [];
        }
        return new Promise((resolve, reject) => { this._resolveStored.push(resolve); this._rejectStored.push(reject); });
    }
}
//# sourceMappingURL=WebcomponentManifestElementsService.js.map