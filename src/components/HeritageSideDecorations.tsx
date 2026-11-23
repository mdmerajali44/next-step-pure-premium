import React, { useEffect, useRef, useState } from 'react';

const leftHeritageUpperImg = '/src/assets/images/left_heritage_upper_1795440876442.jpg';
const leftHeritageLowerImg = '/src/assets/images/left_heritage_lower_1795440875756.jpg';
const rightHeritageUpperImg = '/src/assets/images/right_heritage_upper_1795440876170.jpg';
const rightHeritageLowerImg = '/src/assets/images/right_heritage_lower_1795440876782.jpg';

/**
 * Full-height Bangladeshi heritage, culture, nature & landmark illustrations
 * flanking both sides of <main>, dynamically spanning the entire margin right
 * up to the content edge across all zoom levels, softened with a white shadow
 * wash and subtle dotted mist overlay.
 */
export const HeritageSideDecorations: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layoutMetrics, setLayoutMetrics] = useState<{
    leftWidth: number;
    rightWidth: number;
    cycleCount: number;
  }>({
    leftWidth: 220,
    rightWidth: 220,
    cycleCount: 5,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMetrics = () => {
      const wrapperRect = container.getBoundingClientRect();
      const totalHeight = container.clientHeight || 0;
      const mainEl = container.parentElement?.querySelector('main');

      let leftW = 220;
      let rightW = 220;

      if (mainEl) {
        const mainRect = mainEl.getBoundingClientRect();
        const styles = window.getComputedStyle(mainEl);
        const padLeft = parseFloat(styles.paddingLeft) || 0;
        const padRight = parseFloat(styles.paddingRight) || 0;

        // Exact distance from viewport edge to the outer edge of centered cards/banners
        const contentLeftGap = mainRect.left - wrapperRect.left + padLeft;
        const contentRightGap = wrapperRect.right - (mainRect.right - padRight);

        // +14px soft overlap lets the inner white feather blend seamlessly behind main padding
        leftW = contentLeftGap >= 72 ? Math.round(contentLeftGap + 14) : 0;
        rightW = contentRightGap >= 72 ? Math.round(contentRightGap + 14) : 0;
      }

      // Each 2-panel cycle (upper + lower, 768x1376 each) has height ≈ colWidth * (2 * 1376 / 768)
      const activeColWidth = Math.max(140, leftW, rightW);
      const estimatedCycleHeight = Math.max(460, activeColWidth * 3.58 - 20);
      const needed =
        totalHeight > 0
          ? Math.max(2, Math.min(24, Math.ceil(totalHeight / estimatedCycleHeight) + 1))
          : 5;

      setLayoutMetrics((prev) => {
        if (
          prev.leftWidth === leftW &&
          prev.rightWidth === rightW &&
          prev.cycleCount === needed
        ) {
          return prev;
        }
        return {
          leftWidth: leftW,
          rightWidth: rightW,
          cycleCount: needed,
        };
      });
    };

    updateMetrics();
    const observer = new ResizeObserver(updateMetrics);
    observer.observe(container);
    const mainEl = container.parentElement?.querySelector('main');
    if (mainEl) {
      observer.observe(mainEl);
    }
    window.addEventListener('resize', updateMetrics);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateMetrics);
    };
  }, []);

  const { leftWidth, rightWidth, cycleCount } = layoutMetrics;

  return (
    <div
      ref={containerRef}
      className="hidden min-[1180px]:block pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Left Margin: Spans from outer left edge directly up to <main> content */}
      {leftWidth > 0 && (
        <div
          className="absolute top-0 left-0 bottom-0 overflow-hidden"
          style={{ width: `${leftWidth}px` }}
        >
          <div className="flex flex-col w-full">
            {Array.from({ length: cycleCount }).map((_, idx) => (
              <React.Fragment key={`left-cycle-${idx}`}>
                <img
                  src={leftHeritageUpperImg}
                  alt="বাংলাদেশের ঐতিহ্য ও প্রকৃতি"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto block mix-blend-multiply opacity-[0.52] saturate-[0.38] brightness-[1.08] contrast-[0.96] -mb-2"
                  style={{
                    maskImage:
                      'linear-gradient(to bottom, transparent 0%, black 2.5%, black 97.5%, transparent 100%)',
                    WebkitMaskImage:
                      'linear-gradient(to bottom, transparent 0%, black 2.5%, black 97.5%, transparent 100%)',
                  }}
                />
                <img
                  src={leftHeritageLowerImg}
                  alt="বাংলার সংস্কৃতি ও স্থাপনা"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto block mix-blend-multiply opacity-[0.52] saturate-[0.38] brightness-[1.08] contrast-[0.96] -mb-2"
                  style={{
                    maskImage:
                      'linear-gradient(to bottom, transparent 0%, black 2.5%, black 97.5%, transparent 100%)',
                    WebkitMaskImage:
                      'linear-gradient(to bottom, transparent 0%, black 2.5%, black 97.5%, transparent 100%)',
                  }}
                />
              </React.Fragment>
            ))}
          </div>

          {/* Staggered micro-dot white halftone mist overlay ("ফোটা ফোটা" হালকা টেক্সচার) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255, 255, 255, 0.88) 1.45px, transparent 1.45px), radial-gradient(rgba(255, 255, 255, 0.72) 1.15px, transparent 1.15px)',
              backgroundSize: '5px 5px',
              backgroundPosition: '0 0, 2.5px 2.5px',
            }}
          />

          {/* Directional soft white shadow gradient from inner site edge outward */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to left, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.74) 22%, rgba(255,255,255,0.46) 58%, rgba(255,255,255,0.26) 100%)',
            }}
          />
        </div>
      )}

      {/* Right Margin: Spans from <main> content edge directly out to right viewport edge */}
      {rightWidth > 0 && (
        <div
          className="absolute top-0 right-0 bottom-0 overflow-hidden"
          style={{ width: `${rightWidth}px` }}
        >
          <div className="flex flex-col w-full">
            {Array.from({ length: cycleCount }).map((_, idx) => (
              <React.Fragment key={`right-cycle-${idx}`}>
                <img
                  src={rightHeritageUpperImg}
                  alt="ঐতিহাসিক স্থাপনা ও সুন্দরবন"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto block mix-blend-multiply opacity-[0.52] saturate-[0.38] brightness-[1.08] contrast-[0.96] -mb-2"
                  style={{
                    maskImage:
                      'linear-gradient(to bottom, transparent 0%, black 2.5%, black 97.5%, transparent 100%)',
                    WebkitMaskImage:
                      'linear-gradient(to bottom, transparent 0%, black 2.5%, black 97.5%, transparent 100%)',
                  }}
                />
                <img
                  src={rightHeritageLowerImg}
                  alt="জাতীয় সংসদ ভবন, ষাট গম্বুজ মসজিদ ও দোয়েল"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto block mix-blend-multiply opacity-[0.52] saturate-[0.38] brightness-[1.08] contrast-[0.96] -mb-2"
                  style={{
                    maskImage:
                      'linear-gradient(to bottom, transparent 0%, black 2.5%, black 97.5%, transparent 100%)',
                    WebkitMaskImage:
                      'linear-gradient(to bottom, transparent 0%, black 2.5%, black 97.5%, transparent 100%)',
                  }}
                />
              </React.Fragment>
            ))}
          </div>

          {/* Staggered micro-dot white halftone mist overlay ("ফোটা ফোটা" হালকা টেক্সচার) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255, 255, 255, 0.88) 1.45px, transparent 1.45px), radial-gradient(rgba(255, 255, 255, 0.72) 1.15px, transparent 1.15px)',
              backgroundSize: '5px 5px',
              backgroundPosition: '0 0, 2.5px 2.5px',
            }}
          />

          {/* Directional soft white shadow gradient from inner site edge outward */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.74) 22%, rgba(255,255,255,0.46) 58%, rgba(255,255,255,0.26) 100%)',
            }}
          />
        </div>
      )}

      {/* Soft top & bottom vertical fade for clean transition below ticker and above footer */}
      <div
        className="absolute top-0 inset-x-0 h-8 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
      <div
        className="absolute bottom-0 inset-x-0 h-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
    </div>
  );
};

export default HeritageSideDecorations;
