import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialiseer de Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
});

// De bucket waar ongeprocessede CSV's landen
const bucketName = process.env.GCP_UNPROCESSED_BUCKET_NAME;

// De API route om CSV bestanden te ontvangen en naar Cloud Storage te sturen
export async function POST(request: NextRequest) {
  if (!bucketName) {
    return NextResponse.json(
      { error: 'GCP_UNPROCESSED_BUCKET_NAME is niet ingesteld.' },
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

    // Genereer een unieke bestandsnaam om conflicten te voorkomen
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
        // Het bestand is nu opgeslagen. Dit triggert de Cloud Run-functie.
        // BELANGRIJK: We verwijderen het bestand HIER NIET. 
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