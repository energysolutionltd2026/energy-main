import { useState } from "react";

interface DropdownProps {
  label: string;
  options: string[];
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function Dropdown({ label, options, placeholder, value: controlledValue, onChange }: DropdownProps) {
  const [internalSelected, setInternalSelected] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const isControlled = controlledValue !== undefined;
  const selected = isControlled ? controlledValue : internalSelected;

  const handleSelect = (option: string) => {
    if (!isControlled) setInternalSelected(option);
    onChange?.(option);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col space-y-1 relative">
      <label className="font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border border-gray-400 p-3 rounded-md text-left bg-white focus:ring-2 focus:ring-primary flex justify-between items-center"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-gray-800"
              >
                {option}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
