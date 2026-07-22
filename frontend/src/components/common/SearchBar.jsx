import { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function SearchBar({ value, onChange, placeholder = 'Search displays...' }) {
  const [local, setLocal] = useState(value || '');
  const debounceRef = useRef(null);

  useEffect(() => { setLocal(value || ''); }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(v), 300);
  };

  return (
    <TextField
      size="small"
      value={local}
      onChange={handleChange}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start"><SearchIcon /></InputAdornment>
        ),
      }}
      sx={{ minWidth: 280 }}
    />
  );
}
