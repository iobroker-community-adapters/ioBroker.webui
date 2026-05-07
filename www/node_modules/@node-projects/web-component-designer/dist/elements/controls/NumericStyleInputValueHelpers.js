export function parseNumericStyleInputValue(value) {
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
export function formatNumericStyleInputNumber(value, maxDecimalPlaces = 4) {
    if (!Number.isFinite(value))
        return '0';
    const factor = 10 ** Math.max(0, maxDecimalPlaces);
    const roundedValue = Math.round(value * factor) / factor;
    return Object.is(roundedValue, -0) ? '0' : `${roundedValue}`;
}
export function combineNumericStyleInputValue(numberText, unit) {
    const trimmedNumberText = numberText?.trim() ?? '';
    if (!trimmedNumberText)
        return '';
    return trimmedNumberText + (unit ?? '');
}
export function getNumericStyleInputUnitLabel(unit) {
    return unit === '' ? ' ' : unit;
}
export function normalizeNumericStyleInputOptionValues(values) {
    const normalizedValues = (values ?? [])
        .map(x => x == null ? null : x.trim())
        .filter((x) => x != null);
    return [...new Set(normalizedValues)];
}
export function resolveNumericStyleInputSelectedUnit(parsedUnit, lastNumericUnit, units) {
    if (parsedUnit != null && units.includes(parsedUnit))
        return parsedUnit;
    return lastNumericUnit ?? units[0] ?? null;
}
export function resolveNumericStyleInputStep(unitSteps, defaultStep, unit) {
    if (unit != null) {
        const unitStep = unitSteps?.[unit];
        if (Number.isFinite(unitStep) && unitStep > 0)
            return unitStep;
    }
    return defaultStep;
}
//# sourceMappingURL=NumericStyleInputValueHelpers.js.map