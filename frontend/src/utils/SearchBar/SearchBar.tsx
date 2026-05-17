import { FaSearch } from "react-icons/fa";
import "./SearchBar.css";

import { SearchBarProps } from "./SearchBar.types";

function SearchBar({ placeholder, state, setState, onEnter }: SearchBarProps) {
  return (
    <div className="search-input-container">
      <div className="search-input">
        <input
          type={"text"}
          placeholder={placeholder}
          value={state ?? ""}
          onChange={(e) => setState?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onEnter?.(e);
            }
          }}
        />
        <span className="search-input-icon">
          <FaSearch />
        </span>
      </div>
    </div>
  );
}

export default SearchBar;
