import React from 'react';
import PhoneInputLib, { type Value, type Country } from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  defaultCountry?: Country;
  error?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label,
  defaultCountry = 'FR',
  error,
}) => {
  const isInvalid = value.length > 4 && !isValidPhoneNumber(value);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-dark mb-2 font-inter">
          {label}
        </label>
      )}
      <PhoneInputLib
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value as Value}
        onChange={(val) => onChange(val ?? '')}
        className={`phone-input-custom ${isInvalid ? 'phone-input-error' : ''}`}
      />
      {isInvalid && (
        <p className="mt-1 text-xs text-red-500">Numéro de téléphone invalide</p>
      )}
      {error && !isInvalid && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput;
