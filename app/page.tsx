// frontend/app/page.tsx

"use client"; // Deze pagina haalt nu data op en is interactief 

import { useState, useEffect } from "react";
import { FileUploadComponent } from "../components/FileUploadComponent";
import AnalysisDashboard, {
  GrafiekData,
} from "../components/AnalysisDashboard";
import { Title, Text, Card } from "@tremor/react";

// --- 1. Definieer het volledige API-response type   ---
// (We herhalen de types hier voor de fetch-logica)
interface AnalysisData {
  rapport_tekst: string;
  totaal_uitgaven: number;
  totaal_inkomsten: number;
  grafiek_data: GrafiekData[];
}

// --- 2. De URL van je nieuwe API--
const API_URL = process.env.NEXT_PUBLIC_API_ANALYSIS_URL!;

export default function Home() {
  // State voor het bijhouden van de API data
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 3. Functie om de data op te halen ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Fout bij ophalen data: ${response.statusText}`);
      }
      const data: AnalysisData = await response.json();
      setAnalysisData(data);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. Haal data op zodra de pagina laadt ---
  useEffect(() => {
    fetchData();
  }, []); // De lege array [] betekent: "voer dit 1x uit bij het laden"

  // --- 5. Functie die wordt aangeroepen na een succesvolle upload ---
  // We roepen simpelweg fetchData() opnieuw aan om het dashboard te verversen
  const handleUploadSuccess = () => {
    console.log("Upload succesvol, dashboard wordt ververst...");
    fetchData();
  };

  // --- 6. Render de pagina ---
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-gray-50">
      <div className="w-full max-w-6xl">
        <Title className="text-3xl font-bold text-gray-800">
          Intelligente Financiële Analyse
        </Title>
        <Text className="mt-2 text-lg text-gray-600">
          Upload een CSV-bestand om de analyse te starten of bekijk je huidige
          overzicht.
        </Text>

        {/* --- Sectie 1: Upload --- */}
        <Card className="mt-8">
          <FileUploadComponent onUploadSuccess={handleUploadSuccess} />
        </Card>

        {/* --- Sectie 2: Dashboard --- */}
        <div className="mt-8">
          {/* Toon een laad-indicator */}
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              {/* Spinner is hier verwijderd, alleen de tekst blijft over */}
              <Text className="ml-4 text-lg">Dashboard wordt geladen...</Text>
            </div>
          )}

          {/* Toon een foutmelding */}
          {error && (
            <Card className="border-red-500">
              <Title className="text-red-600">Fout bij laden dashboard</Title>
              <Text>{error}</Text>
              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Probeer opnieuw
              </button>
            </Card>
          )}

          {/* Toon het dashboard als de data er is */}
          {analysisData && !isLoading && (
            <AnalysisDashboard data={analysisData} />
          )}
        </div>
      </div>
    </main>
  );
}