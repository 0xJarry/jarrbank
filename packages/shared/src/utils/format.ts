const PRICE_DECIMALS = 8;
const USD_DECIMALS = 2;

export function formatTokenAmount(amount: bigint, decimals: number): string {
  if (amount === 0n) return '0';
  
  const divisor = 10n ** BigInt(decimals);
  const quotient = amount / divisor;
  const remainder = amount % divisor;
  
  if (remainder === 0n) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const significantDecimals = Math.min(6, decimals);
  const trimmedRemainder = remainderStr.substring(0, significantDecimals).replace(/0+$/, '');
  
  if (trimmedRemainder.length === 0) {
    return quotient.toString();
  }
  
  return `${quotient}.${trimmedRemainder}`;
}

export function formatUSDValue(valueInCents: bigint): string {
  if (valueInCents === 0n) return '$0.00';
  
  const isNegative = valueInCents < 0n;
  const absoluteValue = isNegative ? -valueInCents : valueInCents;
  
  const dollars = absoluteValue / 100n;
  const cents = absoluteValue % 100n;
  
  if (dollars >= 1000000000n) {
    const billions = dollars / 1000000000n;
    const remainder = (dollars % 1000000000n) / 10000000n;
    return `${isNegative ? '-' : ''}$${billions}.${remainder.toString().padStart(2, '0')}B`;
  }
  
  if (dollars >= 1000000n) {
    const millions = dollars / 1000000n;
    const remainder = (dollars % 1000000n) / 10000n;
    return `${isNegative ? '-' : ''}$${millions}.${remainder.toString().padStart(2, '0')}M`;
  }
  
  if (dollars >= 10000n) {
    const thousands = dollars / 1000n;
    const remainder = (dollars % 1000n) / 10n;
    return `${isNegative ? '-' : ''}$${thousands}.${remainder.toString().padStart(2, '0')}K`;
  }
  
  const dollarsStr = dollars.toString();
  const formattedDollars = dollarsStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const centsStr = cents.toString().padStart(2, '0');
  
  return `${isNegative ? '-' : ''}$${formattedDollars}.${centsStr}`;
}

export function calculateTokenValue(
  balance: bigint,
  decimals: number,
  priceUSD: bigint
): bigint {
  const divisor = 10n ** BigInt(decimals);
  return (balance * priceUSD) / divisor;
}

export function parsePriceToUSDCents(price: number): bigint {
  const priceInCents = Math.round(price * 100);
  return BigInt(priceInCents);
}

export function formatPercentage(value: number): string {
  if (value === 0) return '0%';
  
  if (Math.abs(value) < 0.01) {
    return '<0.01%';
  }
  
  if (Math.abs(value) >= 100) {
    return `${Math.round(value)}%`;
  }
  
  return `${value.toFixed(2)}%`;
}

export function calculatePercentageChange(
  oldValue: bigint,
  newValue: bigint
): number {
  if (oldValue === 0n) {
    return newValue > 0n ? 100 : 0;
  }
  
  const difference = newValue - oldValue;
  const percentageChange = (Number(difference) * 100) / Number(oldValue);
  
  return Math.round(percentageChange * 100) / 100;
}

export function formatCompactNumber(value: bigint): string {
  const num = Number(value);
  
  if (num >= 1e12) {
    return `${(num / 1e12).toFixed(2)}T`;
  }
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  }
  
  return num.toString();
}

export function parseFormattedUSD(formatted: string): bigint {
  const cleaned = formatted.replace(/[\$,]/g, '');
  
  let multiplier = 1;
  let value = cleaned;
  
  if (cleaned.endsWith('K')) {
    multiplier = 1000;
    value = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('M')) {
    multiplier = 1000000;
    value = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('B')) {
    multiplier = 1000000000;
    value = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('T')) {
    multiplier = 1000000000000;
    value = cleaned.slice(0, -1);
  }
  
  const numericValue = parseFloat(value) * multiplier * 100;
  return BigInt(Math.round(numericValue));
}

export function aggregateTokenValues(tokens: { valueUSD: bigint }[]): bigint {
  return tokens.reduce((sum, token) => sum + token.valueUSD, 0n);
}

export function calculatePortfolioBreakdown<T extends number>(
  portfolios: { chainId: T; totalValue: bigint }[]
): { chainId: T; percentage: number; valueUSD: bigint }[] {
  const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0n);
  
  if (totalValue === 0n) {
    return portfolios.map(p => ({
      chainId: p.chainId,
      percentage: 0,
      valueUSD: 0n
    }));
  }
  
  return portfolios.map(p => ({
    chainId: p.chainId,
    percentage: Number(p.totalValue * 10000n / totalValue) / 100,
    valueUSD: p.totalValue
  }));
}