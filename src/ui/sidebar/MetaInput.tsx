// src/ui/sidebar/MetaInput.tsx
import React, { useState, useEffect, useRef } from 'react';

interface MetaInputProps {
  metaKey: string;
  metaValue?: string;
  onMetaKeyChange: (value: string) => void;
  onMetaValueChange: (value: string) => void;
}

/**
 * MetaInput: gestisce l'input per il meta,
 * con dropdown per i suggerimenti (basato su un array costante)
 * e visualizza in automatico il valore selezionato.
 */
const metaSuggestions = [
  'Urgente', 'Bug', 'Refactoring', 'Frontend', 'Backend',
  'API', 'Design', 'Performance', 'Testing', 'Documentazione',
  'UI', 'UX', 'DevOps', 'Security'
];

const MetaInput: React.FC<MetaInputProps> = ({ metaKey, onMetaKeyChange, onMetaValueChange, metaValue }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (metaKey.trim() === '') {
      setSuggestions([]);
      setDropdownVisible(false);
    } else {
      const filtered = metaSuggestions.filter((s) =>
        s.toLowerCase().includes(metaKey.toLowerCase())
      );
      setSuggestions(filtered);
      setDropdownVisible(filtered.length > 0);
    }
  }, [metaKey]);

  const handleSelectSuggestion = (suggestion: string) => {
    onMetaKeyChange(suggestion);
    setDropdownVisible(false);
  };

  const handleBlur = () => {
    setTimeout(() => setDropdownVisible(false), 100);
  };

  return (
    <>
      <div className="input-group-meta full-width-meta" style={{ position: 'relative' }}>
        <span className="input-group-meta-prepend">@</span>
        <input
          type="text"
          name="meta"
          id="metaInput"
          placeholder="Meta"
          aria-label="Meta"
          autoComplete="off"
          value={metaKey}
          onChange={(e) => onMetaKeyChange(e.target.value)}
          onFocus={() => setDropdownVisible(suggestions.length > 0)}
          onBlur={handleBlur}
          ref={inputRef}
        />
        {dropdownVisible && (
          <div
            className="meta-hint-dropdown"
            id="metaHintDropdown"
            role="listbox"
            aria-label="Suggerimenti Meta"
          >
            {suggestions.map((s) => (
              <div
                key={s}
                className="meta-hint-item"
                onClick={() => handleSelectSuggestion(s)}
                tabIndex={0}
                role="option"
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="meta-selected-list" id="metaSelectedList" aria-label="Meta selezionati">
        {metaKey && (
          <span className="meta-selected-box">
            <span className="meta-selected-circle"></span>
            {metaKey}
            <button
              type="button"
              className="meta-selected-remove"
              aria-label={`Rimuovi filtro ${metaKey}`}
              onClick={() => onMetaKeyChange('')}
            >
              ×
            </button>
          </span>
        )}
      </div>
      {/* Se necessario, puoi gestire anche un campo per metaValue */}
      <div>
        <input
          type="text"
          placeholder="Valore Meta"
          aria-label="Valore Meta"
          value={metaValue}
          onChange={(e) => onMetaValueChange(e.target.value)}
          style={{ marginTop: '8px', width: '100%', padding: '12px 18px', borderRadius: '6px', border: '1.5px solid #353b45', background: '#181a20', color: '#f5f5f5', fontSize: '15px' }}
        />
      </div>
    </>
  );
};

export default MetaInput;