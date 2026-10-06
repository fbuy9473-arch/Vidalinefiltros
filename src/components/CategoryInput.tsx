import React, { useId } from 'react';
import { storageService } from '../services/storage';

// Generic starting points only - the user can type any new category.
const BASE_CATEGORIES = ['Produtos', 'Outros serviços'];

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const CategoryInput: React.FC<CategoryInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Escolha ou escreva uma categoria'
}) => {
  const listId = useId();
  const options = [...new Set([...BASE_CATEGORIES, ...storageService.getProductCategories()])];

  return (
    <>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      <datalist id={listId}>
        {options.map(o => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
};
