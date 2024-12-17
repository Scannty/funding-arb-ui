import React from 'react';

interface DiscreteSliderProps {
  value: number;
  onChange: (event: Event, value: number) => void;
  min: number;
  max: number;
  'aria-label'?: string;
}

export function DiscreteSlider({
  value,
  onChange,
  min,
  max,
  'aria-label': ariaLabel,
}: DiscreteSliderProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const handleTrackClick = (event: React.MouseEvent) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newValue = Math.round(min + (max - min) * percent);
    const clampedValue = Math.max(min, Math.min(max, newValue));
    
    onChange(event as unknown as Event, clampedValue);
  };

  return (
    <div className="relative h-11">
      {/* Track and dots container */}
      <div 
        ref={trackRef}
        className="absolute top-1/2 -translate-y-1/2 w-full h-4 bg-[#E8DEF8] rounded-[2px_16px_16px_2px] cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Active track */}
        <div
          className="absolute top-0 left-0 h-full bg-[#65558F] rounded-l-sm"
          style={{
            width: `${((value - min) / (max - min)) * 100}%`
          }}
        />

        {/* Dots */}
        <div className="absolute w-full flex justify-between px-2 top-1/2 -translate-y-1/2">
          {steps.map((step) => (
            <button
              key={step}
              onClick={(e) => {
                e.stopPropagation();
                onChange(e as unknown as Event, step);
              }}
              className={`w-1 h-1 rounded-full transition-colors
                ${step <= value ? 'bg-[#65558F]' : 'bg-white border border-[#65558F]'}
              `}
            />
          ))}
        </div>
      </div>

      {/* Handle */}
      <div 
        className="absolute top-0 w-1 h-11 bg-[#65558F] rounded-sm"
        style={{
          left: `calc(${((value - min) / (max - min)) * 100}% - 2px)`,
          transition: 'left 0.2s'
        }}
      />
    </div>
  );
}