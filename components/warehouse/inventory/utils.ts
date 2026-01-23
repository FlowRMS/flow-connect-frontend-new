export const formatQuantity = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { maximumFractionDigits: 4 }).replace(/(\.[0-9]*[1-9])0+$|\.0+$/, '$1');
};
