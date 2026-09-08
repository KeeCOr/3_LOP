import type { ComponentPropsWithoutRef } from 'react';

interface GoldAmountProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  amount: number;
  /** Show a leading plus sign for income and rewards. */
  signed?: boolean;
}

/** Accessible, icon-first representation of a gold amount. */
export default function GoldAmount({ amount, signed = false, className = '', ...props }: GoldAmountProps) {
  const display = signed && amount > 0 ? `+${amount}` : amount;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`.trim()} aria-label={`골드 ${display}`} {...props}>
      {/* Local, fixed-size game HUD asset: Next Image adds no value for static export. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/ui/resource-icons/gold.png" alt="" aria-hidden="true" className="h-4 w-4 object-contain" />
      <span>{display}</span>
    </span>
  );
}
