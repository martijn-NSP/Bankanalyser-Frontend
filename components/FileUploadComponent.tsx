// components/FileUploadComponent.tsx

"use client";

import { useState } from "react";

// 1. Definieer de props die dit component accepteert
interface FileUploadProps {
  onUploadSuccess: () => void; // Dit is de functie die page.tsx meegeeft
}

// 2. Accepteer de props (specifiek 'onUploadSuccess')
export function FileUploadComponent({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setMessage(""); // Reset bericht bij nieuw bestand
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setMessage("Selecteer eerst een bestand.");
      return;
    }

    setIsUploading(true);
    setMessage("Bestand uploaden...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Stuurt het bestand naar onze *eigen* Vercel API-route
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`Upload succesvol: ${result.filename}`);
        setFile(null); // Reset het bestandsveld
        // 3. Roep de prop-functie aan om het dashboard te vernieuwen!
        onUploadSuccess();
      } else {
        const error = await response.json();
        setMessage(`Upload mislukt: ${error.message}`);
      }
    } catch (error: any) {
      setMessage(`Fout: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="file-upload"
          className="block text-sm font-medium text-gray-700"
        >
          Selecteer CSV-bestand
        </label>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <button
        type="submit"
        disabled={!file || isUploading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md
          disabled:bg-gray-400 disabled:cursor-not-allowed
          hover:bg-blue-700 transition-colors"
      >
        {isUploading ? "Bezig met uploaden..." : "Upload en Verwerk"}
      </button>

      {message && (
        <p
          className={`text-sm ${
            message.startsWith("Upload succesvol")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}