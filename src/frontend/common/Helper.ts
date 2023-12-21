export function extractPart(obj: any, propertyPath: string) {
    let retVal = obj;
    for (let p of propertyPath.split('.')) {
        retVal = retVal?.[p];
    }
    return retVal;
}