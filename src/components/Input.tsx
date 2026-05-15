interface InputProps {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

export default function Input({ label, placeholder, value, onChange, type = "text" }: InputProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="font-medium text-gray-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="border border-gray-400 p-3 rounded-md focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
