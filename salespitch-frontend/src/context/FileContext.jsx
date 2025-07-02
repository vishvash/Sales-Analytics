import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // const fetchFiles = useCallback(async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const res = await axios.get('http://localhost:8000/getAllAudioFileDetails');
  //     setFiles(res.data);
  //   } catch (err) {
  //     setError(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  // New: fetch files by date range
  const fetchFilesByDate = useCallback(async (from_date, to_date) => {
    setLoading(true);
    setError(null);
    try {
      let url = 'http://localhost:8000/getAllAudioFileDetails';
      const params = [];
      if (from_date) params.push(`from_date=${from_date}`);
      if (to_date) params.push(`to_date=${to_date}`);
      if (params.length) url += `?${params.join('&')}`;
      const res = await axios.get(url);
      setFiles(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilesByDate();
  }, [fetchFilesByDate]);

  const value = useMemo(() => ({
    files,
    setFiles,
    loading,
    error,
    refetchFiles: fetchFilesByDate,
    fetchFilesByDate, // Expose new function
  }), [files, loading, error, fetchFilesByDate]);

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => useContext(FileContext);
