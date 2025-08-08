// Placeholder for shared utilities

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function formatBigInt(value: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  
  if (remainder === 0n) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, '');
  
  return `${quotient}.${trimmedRemainder}`;
}

export function parseUnits(value: string, decimals: number = 18): bigint {
  const [integer, decimal] = value.split('.');
  const integerPart = BigInt(integer || '0') * BigInt(10 ** decimals);
  
  if (!decimal) {
    return integerPart;
  }
  
  const decimalPart = BigInt(decimal.padEnd(decimals, '0').slice(0, decimals));
  return integerPart + decimalPart;
}