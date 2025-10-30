// frontend/components/AnalysisDashboard.tsx

"use client"; // Dit component is interactief

import {
  Card,
  DonutChart,
  BarList,
  Text,
  Title,
  Grid,
  Metric,
  Badge,
} from "@tremor/react";
import { useState } from "react";

// --- 1. Definieer de data types (gebaseerd op je API-contract) ---
interface Subcategorie {
  name: string;
  value: number;
}

export interface GrafiekData {
  categorie: string;
  totaal_bedrag: number;
  percentage: number;
  subcategorieen: Subcategorie[];
}

interface AnalysisData {
  rapport_tekst: string;
  totaal_uitgaven: number;
  totaal_inkomsten: number;
  grafiek_data: GrafiekData[];
}

// --- 2. Definieer de props voor dit component ---
interface DashboardProps {
  data: AnalysisData;
}

// Helper om bedragen netjes te formatteren
const formatCurrency = (value: number) =>
  `€ ${new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

// --- 3. Het Dashboard Component ---
export default function AnalysisDashboard({ data }: DashboardProps) {
  // State om de geselecteerde categorie voor de drill-down bij te houden
  const [geselecteerdeCategorie, setGeselecteerdeCategorie] =
    useState<GrafiekData | null>(null);

  // De data voor de hoofdgrafiek (DonutChart)
  // We mappen de data naar het formaat dat Tremor verwacht
  const hoofGrafiekData = data.grafiek_data.map((item) => ({
    name: item.categorie,
    value: item.totaal_bedrag,
  }));

  // Bepaal welke data de sub-grafiek (BarList) moet tonen
  const subGrafiekData = geselecteerdeCategorie
    ? geselecteerdeCategorie.subcategorieen
    : data.grafiek_data[0]?.subcategorieen || []; // Toon eerste categorie als default

  const subGrafiekTitel = geselecteerdeCategorie
    ? geselecteerdeCategorie.categorie
    : data.grafiek_data[0]?.categorie || "Subcategorieën";

  // --- 4. De "Drill-Down" functie ---
  // Dit wordt aangeroepen als je op een stuk van de DonutChart klikt
  const handleDonutClick = (payload: any) => {
    if (!payload) {
      setGeselecteerdeCategorie(null);
      return;
    }
    const categorieNaam = payload.name;
    const gevonden = data.grafiek_data.find(
      (item) => item.categorie === categorieNaam
    );
    if (gevonden) {
      setGeselecteerdeCategorie(gevonden);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Samenvatting tekst van de API */}
      <Card className="mb-4">
        <Text>Automatisch Rapport</Text>
        <Metric>{data.rapport_tekst}</Metric>
      </Card>

      {/* Totaal Inkomsten & Uitgaven */}
      <Grid numColsSm={1} numColsLg={2} className="gap-4 mb-4">
        <Card>
          <Text>Totaal Inkomsten</Text>
          <Metric className="text-green-600">
            {formatCurrency(data.totaal_inkomsten)}
          </Metric>
        </Card>
        <Card>
          <Text>Totaal Uitgaven</Text>
          <Metric className="text-red-600">
            {formatCurrency(data.totaal_uitgaven)}
          </Metric>
        </Card>
      </Grid>

      {/* De Interactieve Grafieken */}
      <Grid numColsSm={1} numColsLg={5} className="gap-4">
        {/* Hoofdgrafiek (Donut) */}
        <Card className="lg:col-span-3">
          <Title>Uitgaven per Hoofdcategorie</Title>
          <Text>Klik op een categorie voor details</Text>
          <DonutChart
            className="mt-6"
            data={hoofGrafiekData}
            category="value"
            index="name"
            valueFormatter={formatCurrency}
            onValueClick={handleDonutClick} // Hier gebeurt de magie!
            colors={[
              "blue",
              "cyan",
              "indigo",
              "violet",
              "fuchsia",
              "rose",
              "amber",
            ]}
          />
        </Card>

        {/* Subgrafiek (BarList) */}
        <Card className="lg:col-span-2">
          <Title>
            Details voor:{" "}
            <Badge color="blue">{subGrafiekTitel}</Badge>
          </Title>
          <Text>Subcategorieën (gesorteerd op bedrag)</Text>
          <BarList
            data={subGrafiekData}
            className="mt-4"
            valueFormatter={formatCurrency}
          />
        </Card>
      </Grid>
    </div>
  );
}