/** Only explicit monetary metadata: token counts alone cannot establish a price/currency. */
export function reportedCost(response) {
    if (!response || typeof response !== 'object')
        return undefined;
    const data = response;
    const cost = data.estimatedCost ?? data.cost;
    const amount = typeof cost === 'object' && cost ? cost.amount : cost;
    const currency = typeof cost === 'object' && cost ? cost.currency : data.currency;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || typeof currency !== 'string' || !/^[a-z]{3}$/i.test(currency))
        return undefined;
    return { amount, currency: currency.toUpperCase() };
}
export function recordResponseCost(session, response) {
    session.responseCount = (session.responseCount ?? session.messages.filter(message => message.role === 'assistant').length) + 1;
    const cost = reportedCost(response);
    if (!cost)
        return;
    session.costs ??= {};
    session.costs[cost.currency] = (session.costs[cost.currency] ?? 0) + cost.amount;
    session.costResponseCount = (session.costResponseCount ?? 0) + 1;
}
export function costSummary(session) {
    const costs = Object.entries(session.costs ?? {}).filter(([currency, amount]) => /^[A-Z]{3}$/.test(currency) && Number.isFinite(amount) && amount >= 0);
    if (!costs.length)
        return '';
    const partial = (session.costResponseCount ?? 0) < (session.responseCount ?? 0);
    const values = costs.map(([currency, amount]) => new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'code', maximumSignificantDigits: 6 }).format(amount));
    return `Reported cost${partial ? ' (partial)' : ''}: ${values.join(' + ')}`;
}
export function formatElapsed(durationMs) {
    const seconds = Math.max(0, durationMs) / 1000;
    if (seconds < 60)
        return `${Number(seconds.toFixed(1))} s`;
    return `${Math.floor(seconds / 60)} min ${Math.floor(seconds % 60)} s`;
}
