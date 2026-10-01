import React from "react";
import "./Dropdown.css";
import { useTranslation } from "../../i18n";

export default function Dropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  className = "",
  name,
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder || t("select");
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
          aria-label={label || name || resolvedPlaceholder}
        >
          {!selectValue && resolvedPlaceholder ? (
            <option value="" disabled>
              {resolvedPlaceholder}
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
