import "./FormTextarea.css";
import { FormTextareaProps } from "./FormTextarea.types";

export const growHeightOnInput = (textarea: HTMLTextAreaElement) => {
  const element = textarea;
  if (element && textarea) {
    element.style.height = "auto";
    if (textarea.value.length !== 0)
      element.style.height = element.scrollHeight + "px";
  }
};

function FormTextarea({
  labelText,
  name = "",
  placeholder = "",
  isRequired = false,
  state,
  setState,
  width,
  minWidth,
  maxWidth,
  minLength,
  maxLength,
  height,
  minHeight,
  maxHeight,
  id,
  disabled = false,
  isGrowHeightOnInput = false,
  setStateParams,
  readOnly = false,
  defaultValue = "",
  afterChange,
  className = "",
}: FormTextareaProps) {
  const resolvedPlaceholder =
    isRequired && !labelText ? `* ${placeholder}` : placeholder;

  return (
    <div
      className={`form-textarea-container ${className}`}
      style={{ width: width }}
    >
      {labelText && (
        <label className="form-textarea-label">
          {labelText}
          {isRequired && (
            <span className="form-required-indicator" aria-hidden="true">
              {" *"}
            </span>
          )}
        </label>
      )}
      <div className="form-textarea">
        <textarea
          id={id}
          placeholder={resolvedPlaceholder}
          name={name}
          required={isRequired}
          value={state ?? ""}
          defaultValue={defaultValue}
          onChange={(e) => {
            if (setState) {
              const params = setStateParams ?? name;
              setState(e.target.value, params, name);
            }

            if (afterChange) afterChange();

            if (isGrowHeightOnInput) {
              growHeightOnInput(e.target);
            }
          }}
          style={{
            width: "100%",
            height: height,
            minWidth: minWidth,
            maxWidth: maxWidth,
            minHeight: minHeight,
            maxHeight: maxHeight,
          }}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

export default FormTextarea;
