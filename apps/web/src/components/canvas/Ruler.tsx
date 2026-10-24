import { Unit, convertUnits } from '@pixture/layout-engine';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  lengthMm: number;
  scalePxPerMm: number;
  unit: Unit;
}

export function Ruler({ orientation, lengthMm, scalePxPerMm, unit }: RulerProps) {
  const isH = orientation === 'horizontal';

  // Dynamically select major step based on scalePxPerMm so numbers never crowd or overlap
  let stepMm = 10;
  if (unit === 'in') {
    const candidateInches = [1, 2, 5];
    const chosen = candidateInches.find((inc) => inc * 25.4 * scalePxPerMm >= 24) ?? 5;
    stepMm = chosen * 25.4;
  } else {
    // For mm and cm
    const candidateUnits = unit === 'cm' ? [1, 2, 5, 10] : [10, 20, 50, 100];
    const candidateMm = unit === 'cm' ? candidateUnits.map((u) => u * 10) : candidateUnits;
    const chosenIdx = candidateMm.findIndex((mm) => mm * scalePxPerMm >= 20);
    stepMm = chosenIdx !== -1 ? candidateMm[chosenIdx] : candidateMm[candidateMm.length - 1];
  }

  const halfStep = stepMm / 2;
  const totalSteps = Math.floor(lengthMm / halfStep);
  const ticks: Array<{ posPx: number; label: string; isMajor: boolean }> = [];

  for (let i = 0; i <= totalSteps; i++) {
    const mm = i * halfStep;
    const isMajor = i % 2 === 0;
    const posPx = Math.round(mm * scalePxPerMm * 10) / 10;
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
        className="h-6 relative bg-md-surface border-b border-md-outline-variant select-none overflow-hidden shrink-0"
        style={{ width: `${lengthMm * scalePxPerMm}px` }}
        aria-hidden="true"
      >
        {ticks.map((t, idx) => {
          const isFirst = idx === 0;
          const isLast = t.posPx >= lengthMm * scalePxPerMm - 10;

          return (
            <div
              key={idx}
              className="absolute bottom-0 flex flex-col items-center justify-end"
              style={{
                left: `${t.posPx}px`,
                height: '100%',
                width: 0,
              }}
            >
              {t.isMajor && t.label && (
                <span
                  className={`text-[8px] font-mono text-md-on-surface-variant absolute bottom-[7px] leading-none select-none ${
                    isFirst
                      ? 'left-[2px] translate-x-0'
                      : isLast
                        ? 'right-[2px] -translate-x-full'
                        : 'left-0 -translate-x-1/2'
                  }`}
                >
                  {t.label}
                </span>
              )}
              <div
                className={`bg-md-outline shrink-0 ${
                  t.isMajor ? 'h-[5px] w-[1px]' : 'h-[2.5px] w-[1px] opacity-50'
                }`}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="w-8 relative bg-md-surface border-r border-md-outline-variant select-none overflow-hidden shrink-0"
      style={{ height: `${lengthMm * scalePxPerMm}px` }}
      aria-hidden="true"
    >
      {ticks.map((t, idx) => {
        const isFirst = idx === 0;
        const isLast = t.posPx >= lengthMm * scalePxPerMm - 8;

        return (
          <div
            key={idx}
            className="absolute right-0 flex items-center justify-end"
            style={{
              top: `${t.posPx}px`,
              width: '100%',
              height: 0,
            }}
          >
            {t.isMajor && t.label && (
              <span
                className={`text-[8px] font-mono text-md-on-surface-variant absolute right-[7px] leading-none select-none text-right ${
                  isFirst
                    ? 'top-[2px] translate-y-0'
                    : isLast
                      ? 'top-0 -translate-y-full'
                      : 'top-0 -translate-y-1/2'
                }`}
              >
                {t.label}
              </span>
            )}
            <div
              className={`bg-md-outline shrink-0 ${
                t.isMajor ? 'w-[5px] h-[1px]' : 'w-[2.5px] h-[1px] opacity-50'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
