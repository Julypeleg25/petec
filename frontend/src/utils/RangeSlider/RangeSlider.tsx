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
  const [value, setValue] = useState<number>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, reload]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    setValue(newValue);
    if (onChange) onChange(newValue);
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
            const val = parseFloat(e.target.value);
            if (e.target.value === "" || (val >= min && val <= max))
              setValue(val);
            if (onChange) onChange(val);
          }}
        />
        <span>{min}</span>
      </div>
    </div>
  );
}

export default RangeSlider;
