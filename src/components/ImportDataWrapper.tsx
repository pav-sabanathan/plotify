import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ImportDataModal, { IMPORT_DONE_KEY } from './ImportDataModal';

const ImportDataWrapper = () => {
  const { user, loading } = useAuth();
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setShowImport(false);
      return;
    }
    // Only show once per account
    const checked = localStorage.getItem(IMPORT_DONE_KEY);
    if (checked) {
      setShowImport(false);
      return;
    }
    // Check if there's local data
    const hasShows = (() => {
      try {
        const stored = localStorage.getItem('plotify-shows');
        if (!stored) return false;
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch { return false; }
    })();
    const hasServices = (() => {
      try {
        const stored = localStorage.getItem('plotify-custom-services');
        if (!stored) return false;
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch { return false; }
    })();

    if (hasShows || hasServices) {
      setShowImport(true);
    } else {
      localStorage.setItem(IMPORT_DONE_KEY, '1');
    }
  }, [user, loading]);

  if (!showImport) return null;

  return <ImportDataModal onDone={() => {
    setShowImport(false);
    // Force reload to pick up imported data
    window.location.reload();
  }} />;
};

export default ImportDataWrapper;
