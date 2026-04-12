import { DeleteAction } from "../undoService/transactionItems/DeleteAction.js";
export class DeletionService {
    removeItems(items) {
        items[0].instanceServiceContainer.undoService.execute(new DeleteAction(items));
        if (items[0].serviceContainer.referencesChangedService)
            items[0].serviceContainer.referencesChangedService.notifyReferencesChanged(items.map(item => ({ designItem: item, type: 'deleted' })));
    }
}
//# sourceMappingURL=DeletionService.js.map