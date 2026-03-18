import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Search, Upload, Database, FileText, FileJson, X, ChevronRight, Info, Loader2, Filter, Settings, ArrowUp, ArrowDown, Plus, Share2, Copy, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { DataRecord } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { playSound } from './utils/sound';
import { formatValue } from './utils/formatters';

const Highlight = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim() || !text) return <>{text}</>;
  const strText = String(text);
  const parts = strText.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? 
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/50 text-zinc-900 dark:text-zinc-50 rounded-sm px-0.5">{part}</mark> : 
          part
      )}
    </>
  );
};

const Badge = ({ value, searchQuery }: { value: any, searchQuery: string }) => {
  if (value === null || value === undefined || value === '') return null;
  const strVal = String(value).toLowerCase();
  let colorClass = "bg-zinc-800/50 text-zinc-300 border-zinc-700"; 
  
  if (strVal.includes('info') || strVal.includes('pending') || strVal.includes('medium') || strVal.includes('wait')) {
    colorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  } else if (strVal.includes('clarification') || strVal.includes('cancel') || strVal.includes('high') || strVal.includes('urgent') || strVal.includes('error') || strVal.includes('fail')) {
    colorClass = "bg-red-500/10 text-red-400 border-red-500/20";
  } else if (strVal.includes('process') || strVal.includes('release') || strVal.includes('low') || strVal.includes('active') || strVal.includes('complete') || strVal.includes('success') || strVal.includes('done') || strVal.includes('clear')) {
    colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (strVal.includes('check') || strVal.includes('valuation') || strVal.includes('progress') || strVal.includes('review')) {
    colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }

  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border font-semibold whitespace-nowrap ${colorClass}`}>
      <Highlight text={String(value)} highlight={searchQuery} />
    </span>
  );
};

const RecordCard = React.memo(({ record, cardConfig, searchQuery, onClick, measureElement, virtualItem }: any) => {
  const primaryVal = record[cardConfig.primary];
  const statusVal = cardConfig.status ? record[cardConfig.status] : null;
  const priorityVal = cardConfig.priority ? record[cardConfig.priority] : null;
  
  return (
    <div
      ref={measureElement}
      data-index={virtualItem.index}
      className="absolute top-0 left-0 w-full px-4 pb-3"
      style={{ transform: `translateY(${virtualItem.start}px)` }}
    >
      <div
        onClick={() => { playSound('pop'); onClick(record); }}
        className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 active:scale-[0.98] transition-all cursor-pointer hover:border-zinc-200 dark:hover:border-zinc-700"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base break-words leading-tight">
              <Highlight text={formatValue(primaryVal, cardConfig.primary) || 'Untitled'} highlight={searchQuery} />
            </h3>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
              {cardConfig.primary}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1.5 flex-shrink-0 ml-2">
            {statusVal && <Badge value={statusVal} searchQuery={searchQuery} />}
            {priorityVal && <Badge value={priorityVal} searchQuery={searchQuery} />}
          </div>
        </div>
        
        <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
          {cardConfig.others.map((col: string) => {
            const val = record[col];
            if (val === null || val === undefined || val === '') return null;
            return (
              <div key={col} className="flex flex-col sm:flex-row sm:items-start text-sm">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium mr-2 shrink-0 text-xs sm:text-sm sm:w-1/3">
                  {col}:
                </span>
                <span className="text-zinc-800 dark:text-zinc-200 break-words flex-1">
                  <Highlight text={formatValue(val, col)} highlight={searchQuery} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

function App() {
  const [data, setData] = useState<DataRecord[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [activeModal, setActiveModal] = useState<'none' | 'detail' | 'settings' | 'filter' | 'sort'>('none');
  const [selectedRecord, setSelectedRecord] = useState<DataRecord | null>(null);
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);

  // Configs
  const [cardConfig, setCardConfig] = useState({ primary: '', status: '', priority: '', others: [] as string[] });
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc'|'desc'} | null>(null);
  const [filters, setFilters] = useState<{id: string, column: string, value: string}[]>([]);

  const parentRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('mobile_db_data');
    const savedHeaders = localStorage.getItem('mobile_db_headers');
    if (savedData && savedHeaders) {
      try {
        const pData = JSON.parse(savedData);
        const pHeaders = JSON.parse(savedHeaders);
        setData(pData);
        setHeaders(pHeaders);
        autoDetectCardConfig(pHeaders);
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
  }, []);

  const autoDetectCardConfig = (hdrs: string[]) => {
    setCardConfig({
      primary: hdrs.find(h => /name|title|tracking|id|no/i.test(h)) || hdrs[0] || '',
      status: hdrs.find(h => /status|state/i.test(h)) || '',
      priority: hdrs.find(h => /priority|urgency/i.test(h)) || '',
      others: hdrs.filter(h => !/name|title|tracking|id|no|status|state|priority|urgency/i.test(h)).slice(0, 3)
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    playSound('click');
    setLoading(true);
    setError(null);
    setSelectedRecord(null);
    setSearchQuery('');
    setFilters([]);
    setSortConfig(null);

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    const processData = (parsedData: any[], parsedHeaders: string[]) => {
      setData(parsedData);
      setHeaders(parsedHeaders);
      autoDetectCardConfig(parsedHeaders);
      try {
        localStorage.setItem('mobile_db_data', JSON.stringify(parsedData));
        localStorage.setItem('mobile_db_headers', JSON.stringify(parsedHeaders));
      } catch (e) {
        console.warn('Data too large for localStorage');
      }
      setLoading(false);
      playSound('success');
      if (event.target) event.target.value = '';
    };

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError('Error parsing CSV file. Please check the format.');
            setLoading(false);
            if (event.target) event.target.value = '';
            return;
          }
          const parsedData = results.data as DataRecord[];
          const parsedHeaders = results.meta.fields || Object.keys(parsedData[0] || {});
          processData(parsedData, parsedHeaders);
        },
        error: (err) => {
          setError(err.message);
          setLoading(false);
          if (event.target) event.target.value = '';
        }
      });
    } else if (fileExt === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let parsedData = JSON.parse(content);
          if (!Array.isArray(parsedData)) {
            if (typeof parsedData === 'object' && parsedData !== null) {
              const arrayValues = Object.values(parsedData).filter(Array.isArray);
              if (arrayValues.length > 0) {
                parsedData = arrayValues[0];
              } else {
                parsedData = [parsedData];
              }
            } else {
              throw new Error('JSON must contain an array of objects');
            }
          }
          const parsedHeaders = Object.keys(parsedData[0] || {});
          processData(parsedData, parsedHeaders);
        } catch (err: any) {
          setError('Invalid JSON file: ' + err.message);
          setLoading(false);
          if (event.target) event.target.value = '';
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
        if (event.target) event.target.value = '';
      };
      reader.readAsText(file);
    } else {
      setError('Unsupported file format. Please upload a CSV or JSON file.');
      setLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const clearData = () => {
    playSound('click');
    if (window.confirm('Are you sure you want to clear the loaded database?')) {
      setData([]);
      setHeaders([]);
      setSearchQuery('');
      setFilters([]);
      setSortConfig(null);
      localStorage.removeItem('mobile_db_data');
      localStorage.removeItem('mobile_db_headers');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = data;

    // 1. Multi-filters
    if (filters.length > 0) {
      result = result.filter(record => {
        return filters.every(f => {
          if (!f.column || !f.value) return true;
          const val = record[f.column];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(f.value.toLowerCase());
        });
      });
    }

    // 2. Global search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(record => {
        return Object.values(record).some(value => 
          value !== null && value !== undefined && String(value).toLowerCase().includes(query)
        );
      });
    }

    // 3. Sorting
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const valA = a[sortConfig.column];
        const valB = b[sortConfig.column];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        const numA = Number(strA.replace(/[^0-9.-]+/g,""));
        const numB = Number(strB.replace(/[^0-9.-]+/g,""));
        if (!isNaN(numA) && !isNaN(numB) && strA.match(/\d/) && strB.match(/\d/)) {
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }
        
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortConfig]);

  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  });

  const handleShare = async (record: DataRecord) => {
    playSound('success');
    const text = Object.entries(record)
      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${formatValue(v, k)}`)
      .join('\n');
      
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Record Details',
          text: text,
        });
      } catch (e) {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  const handleCopy = (record: DataRecord) => {
    playSound('success');
    const text = Object.entries(record)
      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${formatValue(v, k)}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const openModal = (type: typeof activeModal, record?: DataRecord) => {
    playSound('swoosh');
    setActiveModal(type);
    if (record) {
      setSelectedRecord(record);
      setIsAdditionalOpen(false);
    }
  };

  const closeModal = () => {
    playSound('swoosh');
    setActiveModal('none');
    if (activeModal === 'detail') setSelectedRecord(null);
  };

  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 text-center border border-zinc-100 dark:border-zinc-800 transition-colors">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors">
            <Database className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Database Viewer</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            Upload a CSV or JSON file to view and search your database on the go.
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6 text-sm text-left flex items-start border border-red-100 dark:border-red-900/30">
              <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <label className="relative block w-full cursor-pointer group">
            <input 
              type="file" 
              accept=".csv,.json" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <div className={`flex items-center justify-center w-full px-6 py-4 rounded-xl transition-all ${
              loading 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500' 
                : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-[0.98]'
            }`}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Select File</span>
                </div>
              )}
            </div>
          </label>
          
          <div className="mt-8 flex justify-center space-x-6 text-zinc-400 dark:text-zinc-500">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-medium uppercase tracking-wider">CSV</span>
            </div>
            <div className="flex items-center">
              <FileJson className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-medium uppercase tracking-wider">JSON</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 z-10 transition-colors flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center transition-colors">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">Database</h1>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => openModal('settings')} className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <label className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors cursor-pointer">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" disabled={loading} />
            </label>
            <button onClick={clearData} className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search all fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/30 rounded-xl py-2 pl-9 pr-8 text-sm transition-all outline-none text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex space-x-2">
            <button 
              onClick={() => openModal('filter')}
              className={`flex items-center px-2.5 py-1.5 rounded-lg border transition-colors ${filters.length > 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filter {filters.length > 0 && `(${filters.length})`}
            </button>
            <button 
              onClick={() => openModal('sort')}
              className={`flex items-center px-2.5 py-1.5 rounded-lg border transition-colors ${sortConfig ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
            >
              {sortConfig?.direction === 'desc' ? <ArrowDown className="w-3.5 h-3.5 mr-1" /> : <ArrowUp className="w-3.5 h-3.5 mr-1" />}
              Sort
            </button>
          </div>
          <span className="text-zinc-500 dark:text-zinc-400">{filteredAndSortedData.length} records</span>
        </div>
      </header>

      {/* Virtualized List */}
      <main ref={parentRef} className="flex-1 overflow-y-auto relative">
        {filteredAndSortedData.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
              <Search className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">No results found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Try adjusting your search query or filters</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const record = filteredAndSortedData[virtualItem.index];
              return (
                <RecordCard 
                  key={virtualItem.key}
                  record={record}
                  cardConfig={cardConfig}
                  searchQuery={searchQuery}
                  onClick={(r: any) => openModal('detail', r)}
                  measureElement={rowVirtualizer.measureElement}
                  virtualItem={virtualItem}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-zinc-50 dark:bg-zinc-950 rounded-t-3xl flex flex-col max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Detail Modal */}
              {activeModal === 'detail' && selectedRecord && (
                <>
                  <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center">
                      <button onClick={closeModal} className="w-10 h-10 -ml-2 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 rounded-full">
                        <X className="w-5 h-5" />
                      </button>
                      <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 ml-2">Record Details</h2>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => handleCopy(selectedRecord)} className="p-2 text-zinc-500 hover:text-indigo-600 rounded-full">
                        <Copy className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleShare(selectedRecord)} className="p-2 text-zinc-500 hover:text-indigo-600 rounded-full">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </header>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Key Information */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Key Information</h3>
                      </div>
                      {[cardConfig.primary, cardConfig.status, cardConfig.priority].filter(Boolean).map((header, index, arr) => {
                        const value = selectedRecord[header];
                        const isEmpty = value === null || value === undefined || value === '';
                        return (
                          <div key={header} className={`p-4 ${index !== arr.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}>
                            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{header}</div>
                            <div className={`text-sm ${isEmpty ? 'text-zinc-400 italic' : 'text-zinc-900 dark:text-zinc-50 break-words'}`}>
                              {isEmpty ? 'Empty' : formatValue(value, header)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Additional Details Accordion */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                      <button 
                        onClick={() => { playSound('click'); setIsAdditionalOpen(!isAdditionalOpen); }}
                        className="w-full px-4 py-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Additional Details</h3>
                        {isAdditionalOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                      </button>
                      
                      <AnimatePresence>
                        {isAdditionalOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            {headers.filter(h => ![cardConfig.primary, cardConfig.status, cardConfig.priority].includes(h)).map((header, index, arr) => {
                              const value = selectedRecord[header];
                              const isEmpty = value === null || value === undefined || value === '';
                              return (
                                <div key={header} className={`p-4 border-t border-zinc-100 dark:border-zinc-800`}>
                                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{header}</div>
                                  <div className={`text-sm ${isEmpty ? 'text-zinc-400 italic' : 'text-zinc-900 dark:text-zinc-50 break-words'}`}>
                                    {isEmpty ? 'Empty' : formatValue(value, header)}
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}

              {/* Settings Modal */}
              {activeModal === 'settings' && (
                <div className="p-4 flex flex-col h-full max-h-[80vh]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Card Settings</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="overflow-y-auto flex-1 space-y-4 pb-8">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Primary Identifier</label>
                      <select 
                        value={cardConfig.primary} 
                        onChange={e => setCardConfig({...cardConfig, primary: e.target.value})}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-50"
                      >
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Status Badge (Optional)</label>
                      <select 
                        value={cardConfig.status} 
                        onChange={e => setCardConfig({...cardConfig, status: e.target.value})}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-50"
                      >
                        <option value="">-- None --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Priority Badge (Optional)</label>
                      <select 
                        value={cardConfig.priority} 
                        onChange={e => setCardConfig({...cardConfig, priority: e.target.value})}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-50"
                      >
                        <option value="">-- None --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Additional Fields (Max 4)</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900">
                        {headers.map(h => {
                          const isChecked = cardConfig.others.includes(h);
                          const isDisabled = !isChecked && cardConfig.others.length >= 4;
                          return (
                            <label key={h} className={`flex items-center space-x-2 text-sm ${isDisabled ? 'opacity-50' : 'cursor-pointer'}`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={(e) => {
                                  playSound('click');
                                  if (e.target.checked) setCardConfig({...cardConfig, others: [...cardConfig.others, h]});
                                  else setCardConfig({...cardConfig, others: cardConfig.others.filter(o => o !== h)});
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                              />
                              <span className="text-zinc-700 dark:text-zinc-300 truncate">{h}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Modal */}
              {activeModal === 'filter' && (
                <div className="p-4 flex flex-col h-full max-h-[80vh]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Multi-Filter</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="overflow-y-auto flex-1 space-y-3 pb-4">
                    {filters.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No active filters.</p>
                    ) : (
                      filters.map(f => (
                        <div key={f.id} className="flex space-x-2 items-start bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <div className="flex-1 space-y-2">
                            <select 
                              value={f.column} 
                              onChange={e => { playSound('click'); setFilters(filters.map(fl => fl.id === f.id ? {...fl, column: e.target.value} : fl)); }}
                              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-zinc-50"
                            >
                              {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <input 
                              type="text" 
                              placeholder="Contains text..." 
                              value={f.value}
                              onChange={e => setFilters(filters.map(fl => fl.id === f.id ? {...fl, value: e.target.value} : fl))}
                              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400"
                            />
                          </div>
                          <button onClick={() => { playSound('click'); setFilters(filters.filter(fl => fl.id !== f.id)); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                    <button 
                      onClick={() => { playSound('click'); setFilters([...filters, { id: Math.random().toString(), column: headers[0] || '', value: '' }]); }}
                      className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-400 font-medium text-sm flex items-center justify-center hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Filter
                    </button>
                  </div>
                </div>
              )}

              {/* Sort Modal */}
              {activeModal === 'sort' && (
                <div className="p-4 flex flex-col h-full max-h-[80vh]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Sort Records</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="space-y-4 pb-8">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sort By Column</label>
                      <select 
                        value={sortConfig?.column || ''} 
                        onChange={e => { playSound('click'); setSortConfig({ column: e.target.value, direction: sortConfig?.direction || 'asc' }); }}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-50"
                      >
                        <option value="">-- None --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {sortConfig && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => { playSound('click'); setSortConfig({...sortConfig, direction: 'asc'}); }}
                          className={`flex-1 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center transition-colors ${sortConfig.direction === 'asc' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                        >
                          <ArrowUp className="w-4 h-4 mr-2" /> Ascending
                        </button>
                        <button 
                          onClick={() => { playSound('click'); setSortConfig({...sortConfig, direction: 'desc'}); }}
                          className={`flex-1 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center transition-colors ${sortConfig.direction === 'desc' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                        >
                          <ArrowDown className="w-4 h-4 mr-2" /> Descending
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
