const cssNumericKeywordValues = ['initial', 'inherit', 'unset'];
export const defaultCssNumericUnits = {
    "css-length": ['px', '%', 'em', 'rem', 'vw', 'vh', 'vmin', 'vmax', 'pt', 'pc', 'in', 'cm', 'mm', 'q', 'ch', 'ex'],
    "css-angle": ['deg', 'grad', 'rad', 'turn'],
    "css-time": ['ms', 's'],
    "css-frequency": ['hz', 'khz'],
    "css-flex": ['fr'],
    "css-resolution": ['dpi', 'dpcm', 'dppx', 'x'],
    "css-scale": ['', '%'],
    "svg-length": ['', '%']
};
const editorTypes = Object.keys(defaultCssNumericUnits);
export const defaultCssNumericUnitSteps = {
    "css-length": { em: 0.1, rem: 0.1, 'in': 0.01, cm: 0.1, ch: 0.1, ex: 0.1 },
    "css-angle": { rad: 0.01, turn: 0.1 },
    "css-time": { ms: 10, s: 0.1 },
    "css-frequency": { khz: 0.1 },
    "css-flex": { fr: 0.1 },
    "css-resolution": { dppx: 0.1, x: 0.1 },
    "css-scale": { '': 0.1, '%': 10 },
    "svg-length": { '': 1, '%': 10 }
};
const absoluteLengthUnitInPx = new Map([
    ['px', 1],
    ['in', 96],
    ['cm', 96 / 2.54],
    ['mm', 96 / 25.4],
    ['q', 96 / 101.6],
    ['pt', 96 / 72],
    ['pc', 16]
]);
const angleUnitInDeg = new Map([
    ['deg', 1],
    ['grad', 0.9],
    ['rad', 180 / Math.PI],
    ['turn', 360]
]);
const timeUnitInMs = new Map([
    ['ms', 1],
    ['s', 1000]
]);
const frequencyUnitInHz = new Map([
    ['hz', 1],
    ['khz', 1000]
]);
const resolutionUnitInDpi = new Map([
    ['dpi', 1],
    ['dpcm', 2.54],
    ['dppx', 96],
    ['x', 96]
]);
const horizontalPercentageReferencePropertyNames = new Set([
    'width',
    'minWidth',
    'maxWidth',
    'inlineSize',
    'minInlineSize',
    'maxInlineSize',
    'left',
    'right',
    'columnGap',
    'gap',
    'flexBasis',
    'perspective'
]);
const verticalPercentageReferencePropertyNames = new Set([
    'height',
    'minHeight',
    'maxHeight',
    'top',
    'bottom',
    'blockSize',
    'minBlockSize',
    'maxBlockSize',
    'rowGap'
]);
const horizontalMeasuredSizePropertyNames = new Set([
    'width',
    'minWidth',
    'maxWidth',
    'inlineSize',
    'minInlineSize',
    'maxInlineSize'
]);
const verticalMeasuredSizePropertyNames = new Set([
    'height',
    'minHeight',
    'maxHeight',
    'blockSize',
    'minBlockSize',
    'maxBlockSize'
]);
function formatNumericStyleInputNumber(value, maxDecimalPlaces = 4) {
    if (!Number.isFinite(value))
        return '0';
    const factor = 10 ** Math.max(0, maxDecimalPlaces);
    const roundedValue = Math.round(value * factor) / factor;
    return Object.is(roundedValue, -0) ? '0' : `${roundedValue}`;
}
function combineNumericStyleInputValue(numberText, unit) {
    const trimmedNumberText = numberText?.trim() ?? '';
    if (!trimmedNumberText)
        return '';
    return trimmedNumberText + (unit ?? '');
}
function parseNumericStyleInputValue(value) {
    const text = value?.trim() ?? '';
    if (!text)
        return { kind: 'empty' };
    const match = text.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:([a-z%]+))?$/i);
    if (!match)
        return { kind: 'text', text };
    const numericValue = Number(match[1]);
    if (Number.isNaN(numericValue))
        return { kind: 'text', text };
    return {
        kind: 'numeric',
        numberText: match[1],
        value: numericValue,
        unit: match[2]?.toLowerCase() ?? ''
    };
}
function dashToCamelCase(text) {
    return text?.replace(/-([a-z])/g, (_, char) => char.toUpperCase()) ?? '';
}
function camelToDashCase(text) {
    return text?.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) ?? '';
}
function getNumericValueDecimalPlaces(context) {
    return context.property.numericValueDecimalPlaces ?? (context.fromUnit === '%' || context.toUnit === '%' ? 2 : 4);
}
function normalizeConvertedValue(result, toUnit, decimalPlaces) {
    if (result == null)
        return null;
    if (typeof result === 'number')
        return combineNumericStyleInputValue(formatNumericStyleInputNumber(result, decimalPlaces), toUnit);
    return result;
}
function getPrimaryElement(context) {
    return context.designItems?.[0]?.element ?? null;
}
function isHTMLElementLike(value) {
    if (!value)
        return false;
    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement)
        return true;
    return typeof value.getBoundingClientRect === 'function';
}
function getParentReferenceElement(element) {
    if (!element)
        return null;
    if (element.parentElement)
        return element.parentElement;
    if (element.assignedSlot)
        return element.assignedSlot;
    const rootNode = element.getRootNode?.();
    const host = rootNode?.host;
    if (isHTMLElementLike(host))
        return host;
    const ownerDocument = element.ownerDocument;
    return ownerDocument?.body ?? ownerDocument?.documentElement ?? null;
}
function getComputedPixelValue(value) {
    const numericValue = parseFloat(value ?? '');
    if (Number.isNaN(numericValue))
        return null;
    return numericValue;
}
function readComputedCssValue(context) {
    if (typeof getComputedStyle !== 'function')
        return null;
    const element = getPrimaryElement(context);
    if (!element)
        return null;
    const computedStyle = getComputedStyle(element);
    const propertyName = context.property.propertyName ?? context.property.name;
    if (!propertyName)
        return null;
    const getPropertyValue = typeof computedStyle.getPropertyValue === 'function'
        ? (name) => computedStyle.getPropertyValue(name)
        : (_name) => '';
    if (propertyName.startsWith('--'))
        return getPropertyValue(propertyName)?.trim() ?? null;
    const dashName = propertyName.includes('-') ? propertyName : camelToDashCase(propertyName);
    const directValue = getPropertyValue(dashName)?.trim();
    if (directValue)
        return directValue;
    const camelName = dashToCamelCase(propertyName);
    return computedStyle[camelName]?.trim() ?? null;
}
function getConvertibleNumericContext(context) {
    const parsedRawValue = parseNumericStyleInputValue(context.rawValue);
    if (parsedRawValue.kind === 'numeric') {
        return {
            ...context,
            value: parsedRawValue.value,
            numberText: parsedRawValue.numberText,
            fromUnit: parsedRawValue.unit || context.fromUnit,
            rawValue: combineNumericStyleInputValue(parsedRawValue.numberText, parsedRawValue.unit)
        };
    }
    const computedValue = readComputedCssValue(context);
    const parsedComputedValue = parseNumericStyleInputValue(computedValue);
    if (parsedComputedValue.kind !== 'numeric') {
        if (context.numericType !== 'css-length')
            return null;
        const measuredSizeInPx = getMeasuredSizeInPx(context);
        if (measuredSizeInPx == null)
            return null;
        const numberText = formatNumericStyleInputNumber(measuredSizeInPx);
        return {
            ...context,
            value: measuredSizeInPx,
            numberText,
            fromUnit: 'px',
            rawValue: combineNumericStyleInputValue(numberText, 'px')
        };
    }
    return {
        ...context,
        value: parsedComputedValue.value,
        numberText: parsedComputedValue.numberText,
        fromUnit: parsedComputedValue.unit,
        rawValue: combineNumericStyleInputValue(parsedComputedValue.numberText, parsedComputedValue.unit)
    };
}
function getViewportUnitInPx(unit) {
    if (typeof window === 'undefined')
        return null;
    switch (unit) {
        case 'vw':
            return window.innerWidth / 100;
        case 'vh':
            return window.innerHeight / 100;
        case 'vmin':
            return Math.min(window.innerWidth, window.innerHeight) / 100;
        case 'vmax':
            return Math.max(window.innerWidth, window.innerHeight) / 100;
        default:
            return null;
    }
}
function getFontSizeReferenceInPx(context, relativeToParent) {
    if (typeof getComputedStyle !== 'function')
        return null;
    const element = getPrimaryElement(context);
    if (!element)
        return null;
    const referenceElement = relativeToParent ? (getParentReferenceElement(element) ?? element) : element;
    return getComputedPixelValue(getComputedStyle(referenceElement).fontSize);
}
function getRootFontSizeInPx() {
    if (typeof getComputedStyle !== 'function' || typeof document === 'undefined')
        return null;
    return getComputedPixelValue(getComputedStyle(document.documentElement).fontSize);
}
function getPercentageReferenceInPx(context) {
    if (typeof getComputedStyle !== 'function')
        return null;
    const element = getPrimaryElement(context);
    if (!element)
        return null;
    const propertyName = dashToCamelCase(context.property.propertyName ?? context.property.name);
    if (propertyName === 'fontSize')
        return getFontSizeReferenceInPx(context, true);
    if (propertyName === 'lineHeight')
        return getFontSizeReferenceInPx(context, false);
    const referenceElement = getParentReferenceElement(element) ?? element;
    const rect = referenceElement.getBoundingClientRect?.();
    if (!rect)
        return null;
    if (verticalPercentageReferencePropertyNames.has(propertyName))
        return rect.height;
    if (horizontalPercentageReferencePropertyNames.has(propertyName))
        return rect.width;
    return rect.width;
}
function getMeasuredSizeInPx(context) {
    const element = getPrimaryElement(context);
    if (!element)
        return null;
    const rect = element.getBoundingClientRect?.();
    if (!rect)
        return null;
    const propertyName = dashToCamelCase(context.property.propertyName ?? context.property.name);
    if (horizontalMeasuredSizePropertyNames.has(propertyName))
        return rect.width;
    if (verticalMeasuredSizePropertyNames.has(propertyName))
        return rect.height;
    return null;
}
function getLengthUnitSizeInPx(context, unit) {
    const normalizedUnit = unit?.toLowerCase() ?? '';
    if (!normalizedUnit)
        return null;
    const absoluteUnitSize = absoluteLengthUnitInPx.get(normalizedUnit);
    if (absoluteUnitSize != null)
        return absoluteUnitSize;
    if (normalizedUnit === '%') {
        const percentageReference = getPercentageReferenceInPx(context);
        return percentageReference == null ? null : percentageReference / 100;
    }
    if (normalizedUnit === 'em')
        return getFontSizeReferenceInPx(context, dashToCamelCase(context.property.propertyName ?? context.property.name) === 'fontSize');
    if (normalizedUnit === 'rem')
        return getRootFontSizeInPx();
    if (normalizedUnit === 'ex') {
        const fontSize = getFontSizeReferenceInPx(context, false);
        return fontSize == null ? null : fontSize / 2;
    }
    if (normalizedUnit === 'ch') {
        const fontSize = getFontSizeReferenceInPx(context, false);
        return fontSize == null ? null : fontSize / 2;
    }
    return getViewportUnitInPx(normalizedUnit);
}
export function defaultConvertCssNumericUnitValue(context) {
    const convertibleContext = getConvertibleNumericContext(context);
    if (!convertibleContext)
        return combineNumericStyleInputValue(context.numberText, context.toUnit);
    const decimalPlaces = getNumericValueDecimalPlaces(context);
    let convertedValue;
    switch (convertibleContext.numericType) {
        case 'css-length':
            convertedValue = convertLengthValue(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, convertibleContext);
            break;
        case 'css-angle':
            convertedValue = convertUsingUnitTable(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, angleUnitInDeg);
            break;
        case 'css-time':
            convertedValue = convertUsingUnitTable(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, timeUnitInMs);
            break;
        case 'css-frequency':
            convertedValue = convertUsingUnitTable(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, frequencyUnitInHz);
            break;
        case 'css-resolution':
            convertedValue = convertUsingUnitTable(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, resolutionUnitInDpi);
            break;
        case 'css-flex':
            convertedValue = convertibleContext.value;
            break;
        case 'css-scale':
            convertedValue = convertScaleValue(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit);
            break;
    }
    if (convertedValue == null)
        return combineNumericStyleInputValue(convertibleContext.numberText, convertibleContext.toUnit);
    return combineNumericStyleInputValue(formatNumericStyleInputNumber(convertedValue, decimalPlaces), convertibleContext.toUnit);
}
function convertLengthValue(value, fromUnit, toUnit, context) {
    const normalizedFromUnit = fromUnit?.toLowerCase() ?? '';
    const normalizedToUnit = toUnit?.toLowerCase() ?? '';
    if (normalizedFromUnit !== '%' && normalizedToUnit === '%') {
        const measuredSizeInPx = getMeasuredSizeInPx(context);
        const percentUnitSize = getLengthUnitSizeInPx(context, normalizedToUnit);
        if (measuredSizeInPx != null && percentUnitSize != null)
            return measuredSizeInPx / percentUnitSize;
    }
    const fromUnitSize = getLengthUnitSizeInPx(context, fromUnit);
    const toUnitSize = getLengthUnitSizeInPx(context, toUnit);
    if (fromUnitSize == null || toUnitSize == null)
        return null;
    return value * fromUnitSize / toUnitSize;
}
function convertScaleValue(value, fromUnit, toUnit) {
    const normalizedFromUnit = fromUnit?.toLowerCase() ?? '';
    const normalizedToUnit = toUnit?.toLowerCase() ?? '';
    if (normalizedFromUnit === normalizedToUnit)
        return value;
    const fromFactor = normalizedFromUnit === '%' ? 0.01 : normalizedFromUnit === '' ? 1 : null;
    const toFactor = normalizedToUnit === '%' ? 0.01 : normalizedToUnit === '' ? 1 : null;
    if (fromFactor == null || toFactor == null)
        return null;
    return value * fromFactor / toFactor;
}
function convertUsingUnitTable(value, fromUnit, toUnit, table) {
    const normalizedFromUnit = fromUnit?.toLowerCase() ?? '';
    const normalizedToUnit = toUnit?.toLowerCase() ?? '';
    if (!normalizedFromUnit || !normalizedToUnit || normalizedFromUnit === normalizedToUnit)
        return value;
    if (!table)
        return null;
    const fromFactor = table.get(normalizedFromUnit);
    const toFactor = table.get(normalizedToUnit);
    if (fromFactor == null || toFactor == null)
        return null;
    return value * fromFactor / toFactor;
}
export function getUnitPropertyType(type, propertyName) {
    if (editorTypes.includes(type ?? ''))
        return type;
    return null;
}
export function isUnitPropertyType(type, propertyName) {
    return getUnitPropertyType(type, propertyName) != null;
}
export function convertNumericUnitValue(context) {
    const decimalPlaces = getNumericValueDecimalPlaces(context);
    const overrideResult = normalizeConvertedValue(context.property.numericValueConverter?.(context.value, context.fromUnit, context.toUnit, context.property, context.numericType, context.numberText, context.rawValue, context.designItems), context.toUnit, decimalPlaces);
    if (overrideResult != null)
        return overrideResult;
    return defaultConvertCssNumericUnitValue(context);
}
export function getCssNumericKeywordValues(values) {
    return [...new Set([...(values ?? []), ...cssNumericKeywordValues].filter(Boolean))];
}
export function applyCssNumericPropertyDefaults(property) {
    const numericType = getUnitPropertyType(property.type, property.propertyName ?? property.name);
    property.values = getCssNumericKeywordValues(property.values);
    if (numericType) {
        property.units ??= [...defaultCssNumericUnits[numericType]];
        property.unitSteps ??= { ...defaultCssNumericUnitSteps[numericType] };
        property.numericValueConverter ??= (value, fromUnit, toUnit, converterProperty, converterNumericType, numberText, rawValue, designItems) => defaultConvertCssNumericUnitValue({
            property: converterProperty,
            numericType: converterNumericType,
            designItems,
            value,
            numberText: numberText ?? `${value}`,
            rawValue: rawValue ?? `${value}${fromUnit}`,
            fromUnit,
            toUnit,
        });
    }
    return property;
}
export function getCssNumericEditorConfig(property) {
    const numericType = getUnitPropertyType(property.type, property.name);
    if (!numericType)
        return null;
    const defaultUnitSteps = defaultCssNumericUnitSteps[numericType] ?? {};
    return {
        numericType,
        units: property.units?.length ? property.units : defaultCssNumericUnits[numericType],
        fixedValues: getCssNumericKeywordValues(property.values),
        unitSteps: { ...defaultUnitSteps, ...(property.unitSteps ?? {}) },
        convertValue: context => convertNumericUnitValue({ ...context, property, numericType })
    };
}
//# sourceMappingURL=UnitPropertyEditorConfig.js.map