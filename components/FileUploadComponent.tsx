'use client'; 
// Dit is een 'Client Component' omdat het interactie (useState, fetch) bevat

import React, { useState } from 'react';

export function FileUploadComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('Klaar om te uploaden.');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus(`Geselecteerd: ${e.target.files[0].name}`);
    } else {
      setFile(null);
      setStatus('Klaar om te uploaden.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('Selecteer eerst een CSV-bestand.');
      return;
    }

    setLoading(true);
    setStatus('Uploaden naar Google Cloud Storage...');

    const formData = new FormData();
    formData.append('file', file); // 'file' is de naam die onze API verwacht

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Dit bericht bevestigt de keten: Frontend -> API Route -> Cloud Storage -> Cloud Run
        setStatus(`Upload succesvol. De analyse van ${result.fileName} is gestart!`);
        // We verwijderen het bestand uit de selector na succes
        setFile(null);
      } else {
        setStatus(`Upload mislukt: ${result.error || 'Onbekende fout.'}`);
      }
    } catch (error) {
      setStatus('Er is een netwerkfout opgetreden bij het uploaden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-700">Upload uw Bankafschrift (.csv)</h2>
      
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      <button 
        onClick={handleUpload} 
        disabled={!file || loading}
        className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition duration-150 ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {loading ? 'Bezig met uploaden...' : 'Upload en Start Analyse'}
      </button>

      <p className={`mt-2 text-sm ${loading ? 'text-blue-600' : status.includes('mislukt') ? 'text-red-500' : 'text-gray-600'}`}>
        {status}
      </p>
    </div>
  );
}