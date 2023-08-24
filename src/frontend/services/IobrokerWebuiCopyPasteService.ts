import { CopyPasteAsJsonService, DesignItem, IDesignItem, IRect, InstanceServiceContainer, ServiceContainer, getFromClipboard } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";

export class IobrokerWebuiCopyPasteService extends CopyPasteAsJsonService {
    override  async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: IRect[]]> {
        const items = await getFromClipboard();
        if (items != null) {
            try {
                let imageFmt = items[0].types.find(x => x.startsWith("image/"))
                if (imageFmt) {
                    let imgData = await items[0].getType(imageFmt);

                    let name = (<any>items[0]).name ?? 'image_1';
                    let ext = imageFmt.substring(6);
                    if (ext == 'svg+xml')
                        ext = 'svg';
                    if (!name.endsWith('.' + ext) || (ext == 'jpeg' && !name.endsWith('.jpg')))
                        name = name + '.' + ext;
                    await iobrokerHandler.saveImage(name, imgData);
                    let img = document.createElement('img');
                    img.src = iobrokerHandler.imagePrefix + name;
                    const di = DesignItem.createDesignItemFromInstance(img, serviceContainer, instanceServiceContainer);
                    return [[di]];
                }
            } catch { }
        }

        return super.getPasteItems(serviceContainer, instanceServiceContainer);
    }
}