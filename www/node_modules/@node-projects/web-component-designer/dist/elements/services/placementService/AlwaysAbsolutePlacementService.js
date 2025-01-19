import { AbsolutePlacementService } from './AbsolutePlacementService.js';
export class AlwaysAbsolutePlacementService extends AbsolutePlacementService {
    serviceForContainer(container, containerStyle, item) {
        return true;
    }
}
//# sourceMappingURL=AlwaysAbsolutePlacementService.js.map