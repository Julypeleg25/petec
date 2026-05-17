import { useState } from "react";
import "./FormInput.css";
import { FaExternalLinkAlt, FaEye } from "react-icons/fa";

import { FormInputProps } from "./FormInput.types";

function FormInput({
  labelText,
  name = "",
  placeholder = "",
  type = "text",
  icon,
  isRequired = false,
  state,
  setState,
  width,
  minLength,
  maxLength,
  min,
  max,
  id,
  disabled,
  setStateParams,
  className,
  isLink = false,
}: FormInputProps) {
  const [inputType, setInputType] = useState(type);
  const linkValue =
    state === null || state === undefined ? "" : String(state).trim();
  const hasLink = linkValue.length > 0;
  const resolvedPlaceholder =
    isRequired && !labelText ? `* ${placeholder}` : placeholder;

  return (
    <div className="form-input-container" style={{ width: width }}>
      {labelText && (
        <label className="form-input-label">
          {labelText}
          {isRequired && (
            <span className="form-required-indicator" aria-hidden="true">
              {" *"}
            </span>
          )}
        </label>
      )}
      <div className="form-input">
        {type === "password" && (
          <FaEye
            className="show-password-icon"
            size={22}
            onMouseDown={() => setInputType("text")}
            onMouseUp={() => setInputType("password")}
          />
        )}
        <input
          id={id}
          type={inputType}
          placeholder={resolvedPlaceholder}
          name={name}
          required={isRequired}
          value={state === null ? "" : state}
          onChange={(e) => {
            if (setState) {
              const params = setStateParams ?? name;
              setState(e.target.value, params, name);
            }
          }}
          style={isLink || type === "password" ? { paddingLeft: "40px" } : {}}
          minLength={minLength}
          maxLength={maxLength}
          min={min}
          max={max}
          disabled={disabled !== undefined ? disabled : false}
          step={type === "number" ? "any" : undefined}
          className={`${className ? className : ""}`}
        />
        {isLink &&
          (hasLink ? (
            <a
              href={linkValue}
              target="_blank"
              className="form-input-link"
              rel="noreferrer"
            >
              <FaExternalLinkAlt />
            </a>
          ) : (
            <span className="form-input-link form-input-link-disabled">
              <FaExternalLinkAlt />
            </span>
          ))}
        {icon && <span className="form-input-icon">{icon}</span>}
      </div>
    </div>
  );
}

export default FormInput;
