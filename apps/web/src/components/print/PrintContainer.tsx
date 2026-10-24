import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../../state/ProjectContext.js';
import {
  getPaperDimensions,
  generateCutMarks,
  computeSheetSlotsGeometry,
  CutMarkStyle,
} from '@pixture/layout-engine';
import { buildCssFilterString, computeSlotPhotoLayout } from '@pixture/print-core';

export function PrintContainer() {
  const { config, pages, photos } = useProject();

  const printRoot = document.getElementById('print-root');
  if (!printRoot) return null;

  const paperDim = getPaperDimensions(
    config.paperId,
    config.orientation,
    config.customWidthMm,
    config.customHeightMm
  );

  const photoMap = useMemo(() => {
    const map = new Map();
    for (const p of photos) {
      map.set(p.id, p);
    }
    return map;
  }, [photos]);

  const slotsGeometry = useMemo(() => {
    const res = computeSheetSlotsGeometry({
      sheetWidthMm: paperDim.widthMm,
      sheetHeightMm: paperDim.heightMm,
      marginsMm: config.marginsMm,
      gapXMm: config.gapXMm,
      gapYMm: config.gapYMm,
      layoutMode: config.layoutMode,
      autoOrientation: config.autoOrientation,
      photoPresetId: config.photoPresetId,
      customPhotoWidthMm: config.customPhotoWidthMm,
      customPhotoHeightMm: config.customPhotoHeightMm,
      primaryPhotoCount: config.primaryPhotoCount ?? 1,
      secondaryPhotoPresetId: config.secondaryPhotoPresetId ?? 'passport_us',
      secondaryPhotoCount: config.secondaryPhotoCount ?? 4,
      customSecondaryWidthMm: config.customSecondaryWidthMm,
      customSecondaryHeightMm: config.customSecondaryHeightMm,
      currentPageIndex: 0,
    });

    return res.allPlacedSlots;
  }, [config, paperDim]);

  return createPortal(
    <div>
      {pages.map((page) => {
        // Only generate cut marks for slots on this page that actually have a photo assigned
        const filledSlots = slotsGeometry.filter((slotGeom) =>
          page.slots.some((s) => s.slotIndex === slotGeom.index && s.photoId)
        );

        const pageCutMarks =
          filledSlots.length > 0 && config.cutMarkStyle !== 'none'
            ? generateCutMarks({
                slots: filledSlots,
                style: config.cutMarkStyle as CutMarkStyle,
                bleedMm: config.bleedMm,
                markLengthMm: 2.0,
                markOffsetMm: 0.5,
              })
            : null;

        return (
          <div
            key={page.id}
            className="print-page relative bg-white overflow-hidden"
            style={{
              width: `${paperDim.widthMm}mm`,
              height: `${paperDim.heightMm}mm`,
            }}
          >
            {/* Vector Cut Marks in print (ONLY for filled photo slots) */}
            {pageCutMarks && pageCutMarks.lines.length > 0 && (
              <svg
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  width: `${paperDim.widthMm}mm`,
                  height: `${paperDim.heightMm}mm`,
                }}
                viewBox={`0 0 ${paperDim.widthMm} ${paperDim.heightMm}`}
              >
                {pageCutMarks.lines.map((line, idx) => (
                  <line
                    key={idx}
                    x1={line.x1Mm}
                    y1={line.y1Mm}
                    x2={line.x2Mm}
                    y2={line.y2Mm}
                    stroke={config.cutMarkColor || '#5f6368'}
                    strokeWidth="0.15"
                    strokeDasharray={line.style === 'dashed' ? '1,1' : undefined}
                  />
                ))}
              </svg>
            )}

            {/* Slots & Photos */}
            {slotsGeometry.map((slotGeom) => {
              const assignment = page.slots.find((s) => s.slotIndex === slotGeom.index);
              const photo = assignment?.photoId ? photoMap.get(assignment.photoId) : null;
              const adj = assignment?.adjustments;

              if (!photo || !adj) return null;

              const bleed = config.bleedMm || 0;
              const slotW = slotGeom.widthMm + bleed * 2;
              const slotH = slotGeom.heightMm + bleed * 2;

              const padT = adj.isPolaroid ? 5 : adj.hasWhiteBorder ? adj.whiteBorderWidthMm : 0;
              const padLR = adj.isPolaroid ? 5 : adj.hasWhiteBorder ? adj.whiteBorderWidthMm : 0;
              const padB = adj.isPolaroid ? 20 : adj.hasWhiteBorder ? adj.whiteBorderWidthMm : 0;

              const innerW = Math.max(1, slotW - padLR * 2);
              const innerH = Math.max(1, slotH - padT - padB);

              const layout = computeSlotPhotoLayout({
                innerW,
                innerH,
                photoWidth: photo.width || 1,
                photoHeight: photo.height || 1,
                adj,
              });

              return (
                <div
                  key={slotGeom.index}
                  className="absolute overflow-hidden flex items-center justify-center bg-white"
                  style={{
                    left: `${slotGeom.xMm - bleed}mm`,
                    top: `${slotGeom.yMm - bleed}mm`,
                    width: `${slotW}mm`,
                    height: `${slotH}mm`,
                  }}
                >
                  <div
                    className="relative overflow-hidden w-full h-full flex items-center justify-center bg-white"
                    style={{
                      padding: `${padT}mm ${padLR}mm ${padB}mm ${padLR}mm`,
                    }}
                  >
                    <div className="relative overflow-hidden w-full h-full flex items-center justify-center">
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          width: `${layout.targetW}mm`,
                          height: `${layout.targetH}mm`,
                          transform: `translate(-50%, -50%) rotate(${adj.rotation}deg) scale(${adj.flipH ? -1 : 1}, ${adj.flipV ? -1 : 1})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={photo.dataUrl}
                          alt={photo.name}
                          className="max-w-none select-none"
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: `${layout.drawW}mm`,
                            height: `${layout.drawH}mm`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            transform: `translate(calc(-50% + ${layout.panOffsetX}mm), calc(-50% + ${layout.panOffsetY}mm))`,
                            filter: buildCssFilterString(adj),
                          }}
                        />
                      </div>
                    </div>

                    {adj.isPolaroid && adj.polaroidCaption && (
                      <div className="absolute bottom-1 w-full text-center font-caveat text-black truncate px-1 text-[12pt]">
                        {adj.polaroidCaption}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>,
    printRoot
  );
}
