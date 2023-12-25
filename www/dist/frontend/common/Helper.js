export function extractPart(obj, propertyPath) {
    let retVal = obj;
    for (let p of propertyPath.split('.')) {
        retVal = retVal?.[p];
    }
    return retVal;
}
