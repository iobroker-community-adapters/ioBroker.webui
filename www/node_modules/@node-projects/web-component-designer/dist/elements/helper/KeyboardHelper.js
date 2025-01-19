import { isAppleDevice } from "./Helper.js";
export function hasCommandKey(event) {
    if (isAppleDevice())
        return event.metaKey;
    return event.ctrlKey;
}
//# sourceMappingURL=KeyboardHelper.js.map