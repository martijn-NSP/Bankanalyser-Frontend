import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialiseer de Google Cloud Storage client
// Authenticatie wordt automatisch afgehandeld door de Vercel env vars
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Vervang \n met echte newlines
  },
});

// --- HIER IS DE WIJZIGING ---
// De bucket waar ongeprocessede CSV's landen. 
// Dit leest nu de variabele die u in Vercel heeft ingesteld (GCP_BUCKET_NAME).
const bucketName = process.env.GCP_BUCKET_NAME;

// De API route om CSV bestanden te ontvangen en naar Cloud Storage te sturen
export async function POST(request: NextRequest) {
  if (!bucketName) {
    return NextResponse.json(
      // Foutmelding ook bijgewerkt om de juiste naam te tonen
      { error: 'GCP_BUCKET_NAME is niet ingesteld in Vercel.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Geen bestand gevonden in de aanvraag.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Genereer een unieke bestandsnaam
    const uniqueFileName = `${Date.now()}-${file.name}`;

    const fileUploadPromise = new Promise<void>((resolve, reject) => {
      const blob = storage.bucket(bucketName).file(uniqueFileName);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.type || 'text/csv',
        },
      });

      blobStream.on('error', (err) => {
        console.error('Fout bij het uploaden naar Cloud Storage:', err);
        reject(err);
      });

      blobStream.on('finish', () => {
        // De Cloud Run-functie (process-bank-csv) is verantwoordelijk voor de opruiming.
        resolve();
      });

      blobStream.end(buffer);
    });

    await fileUploadPromise;

    return NextResponse.json(
      { message: 'Bestand succesvol geüpload. Analyse wordt gestart.', filename: uniqueFileName },
      { status: 200 }
    );
  } catch (error) {
    console.error('Onverwachte fout in de upload API:', error);
    return NextResponse.json(
      { error: 'Interne serverfout bij de verwerking.' },
      { status: 500 }
    );
  }
}