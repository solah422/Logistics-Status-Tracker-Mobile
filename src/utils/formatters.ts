export const formatValue = (val: any, headerName: string = ''): string => {
  if (val === null || val === undefined || val === '') return '';
  const strVal = String(val);
  
  // Date formatting (ISO or YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z?)?$/;
  if (dateRegex.test(strVal)) {
    const d = new Date(strVal);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d);
    }
  }

  // Currency formatting
  const isCurrencyHeader = /price|cost|amount|total|duty|tax|fee/i.test(headerName);
  if (isCurrencyHeader) {
    // If it already has a currency symbol, just return it
    if (strVal.includes('$') || strVal.includes('€') || strVal.includes('£')) return strVal;
    
    const numVal = Number(strVal.replace(/[^0-9.-]+/g,""));
    if (!isNaN(numVal) && strVal.match(/\d/)) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numVal);
    }
  }

  return strVal;
};
