import { useEffect, useState } from "react";
import "./RangeSlider.css";
import { RangeSliderProps } from "./RangeSlider.types";

function RangeSlider({
  min,
  max,
  step,
  label,
  initialValue = 0,
  onChange,
  reload,
}: RangeSliderProps) {
  const normalizeSliderValue = (nextValue: number): number | null => {
    if (!Number.isFinite(nextValue)) {
      return null;
    }

    const clampedValue = Math.min(Math.max(nextValue, min), max);
    if (step <= 0) {
      return clampedValue;
    }

    const stepsFromMin = Math.round((clampedValue - min) / step);
    const snappedValue = min + stepsFromMin * step;
    const roundedValue = Number(snappedValue.toFixed(10));
    return Math.min(Math.max(roundedValue, min), max);
  };

  const [value, setValue] = useState<number>(() => {
    const normalizedInitialValue = normalizeSliderValue(initialValue);
    return normalizedInitialValue ?? min;
  });

  const applyValidSliderValue = (nextValue: number): void => {
    const normalizedValue = normalizeSliderValue(nextValue);
    if (normalizedValue === null) {
      return;
    }

    setValue(normalizedValue);
    if (onChange) {
      onChange(normalizedValue);
    }
  };

  useEffect(() => {
    const normalizedInitialValue = normalizeSliderValue(initialValue);
    setValue(normalizedInitialValue ?? min);
  }, [initialValue, reload]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    applyValidSliderValue(event.target.valueAsNumber);
  };

  return (
    <div className="RangeSlider">
      {label && <label>{label}</label>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
      />
      <div className="range-slider-limits">
        <span>{max}</span>
        <input
          className="range-slider-value-input"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            applyValidSliderValue(e.target.valueAsNumber);
          }}
          onBlur={() => {
            const normalizedCurrentValue = normalizeSliderValue(value);
            setValue(normalizedCurrentValue ?? min);
          }}
        />
        <span>{min}</span>
      </div>
    </div>
  );
}

export default RangeSlider;
