import React from 'react';
import { Select, MenuItem, Checkbox, ListItemText } from '@mui/material';

const FileSelector = ({ cache, selectedFiles, setSelectedFiles }) => {
  const allFiles = Object.keys(cache);
  const allSelected = selectedFiles.length === allFiles.length;

  const handleSelectChange = (event) => {
    const value = event.target.value;

    if (value.includes('all')) {
      if (allSelected) {
        setSelectedFiles([]);
      } else {
        setSelectedFiles(allFiles);
      }
    } else {
      setSelectedFiles(value);
    }
  };

  return (
    <Select
      multiple
      displayEmpty
      value={selectedFiles}
      onChange={handleSelectChange}
      renderValue={(selected) => {
        if (selected.length === 0) return 'None Selected';
        if (selected.length === allFiles.length) return 'All Files';
        return selected.join(', ');
      }}
      sx={{ minWidth: 250 }}
      MenuProps={{
        PaperProps: {
          style: {
            maxHeight: 300,         // Vertical scroll
            maxWidth: 400,          // Optional: controls width
            overflowX: 'auto',      // Enables horizontal scroll
            whiteSpace: 'nowrap',   // Prevents line break in long filenames
          },
        },
      }}
    >
      <MenuItem value="all">
        <Checkbox checked={allSelected} indeterminate={selectedFiles.length > 0 && !allSelected} />
        <ListItemText primary="Select All" />
      </MenuItem>
      {allFiles.map((name) => (
        <MenuItem key={name} value={name}>
          <Checkbox checked={selectedFiles.includes(name)} />
          <ListItemText primary={name} />
        </MenuItem>
      ))}
    </Select>
  );
};

export default FileSelector;
