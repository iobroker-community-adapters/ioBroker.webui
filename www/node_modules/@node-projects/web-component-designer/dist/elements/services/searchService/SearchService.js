import { DesignItem } from "../../item/DesignItem.js";
export class SearchService {
    async search(designerCanvas, searchTerm, options) {
        if (searchTerm != "") {
            let selectedElements = designerCanvas.rootDesignItem.querySelectorAll(searchTerm);
            let searchResults = [];
            for (let i = 0; i < selectedElements.length; i++) {
                const designItem = DesignItem.GetDesignItem(selectedElements[i]);
                if (designItem)
                    searchResults.push({ designItem });
            }
            return searchResults;
        }
        return null;
    }
}
//# sourceMappingURL=SearchService.js.map