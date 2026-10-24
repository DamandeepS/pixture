import { Unit, convertUnits } from '@pixture/layout-engine';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  lengthMm: number;
  scalePxPerMm: number;
  unit: Unit;
}

export function Ruler({ orientation, lengthMm, scalePxPerMm, unit }: RulerProps) {
  const isH = orientation === 'horizontal';

  // Major tick spacing based on unit
  // In mm: major tick every 10mm (1cm)
  // In cm: major tick every 1cm
  // In in: major tick every 1in (25.4mm)
  let stepMm = 10;
  if (unit === 'in') {
    stepMm = 25.4;
  }

  const ticks: Array<{ posPx: number; label: string; isMajor: boolean }> = [];
  const maxPos = lengthMm;

  for (let mm = 0; mm <= maxPos; mm += stepMm / 2) {
    const isMajor = Math.abs(mm % stepMm) < 0.1 || Math.abs((mm % stepMm) - stepMm) < 0.1;
    const posPx = mm * scalePxPerMm;
    const convertedVal = convertUnits(mm, 'mm', unit);
    const label = isMajor ? String(Math.round(convertedVal)) : '';

    ticks.push({
      posPx,
      label,
      isMajor,
    });
  }

  if (isH) {
    return (
      <div
        className="h-6 relative bg-md-surface border-b border-md-outline-variant select-none overflow-hidden"
        style={{ width: `${lengthMm * scalePxPerMm}px` }}
        aria-hidden="true"
      >
        {ticks.map((t, idx) => (
          <div
            key={idx}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: `${t.posPx}px` }}
          >
            <div
              className={`w-[1px] bg-md-outline ${t.isMajor ? 'h-3' : 'h-1.5 opacity-60'}`}
            ></div>
            {t.isMajor && (
              <span className="text-[9px] font-mono text-md-on-surface-variant absolute -top-4 -translate-x-1/2">
                {t.label}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="w-6 relative bg-md-surface border-r border-md-outline-variant select-none overflow-hidden shrink-0"
      style={{ height: `${lengthMm * scalePxPerMm}px` }}
      aria-hidden="true"
    >
      {ticks.map((t, idx) => (
        <div
          key={idx}
          className="absolute right-0 flex items-center"
          style={{ top: `${t.posPx}px` }}
        >
          <div
            className={`h-[1px] bg-md-outline ${t.isMajor ? 'w-3' : 'w-1.5 opacity-60'}`}
          ></div>
          {t.isMajor && (
            <span className="text-[9px] font-mono text-md-on-surface-variant absolute -left-4 -translate-y-1/2">
              {t.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
