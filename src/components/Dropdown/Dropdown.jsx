import React from "react";
import "./Dropdown.css";

export default function Dropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Selecione",
  className = "",
  name,
}) {
  const selectValue = value ?? "";

  return (
    <div className={`dropdown ${className}`.trim()}>
      {label ? <label className="dropdown-label">{label}</label> : null}
      <div className="dropdown-field">
        <select
          className="dropdown-select"
          value={selectValue}
          onChange={onChange}
          name={name}
          aria-label={label || name || placeholder}
        >
          {!selectValue && placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}

          {options.map((option) => (
            <option key={option.value ?? option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="dropdown-chevron fi fi-rr-angle-small-down"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
