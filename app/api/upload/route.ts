import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Next.js instelling: zorgt ervoor dat dit een server-side functie blijft
export const dynamic = 'force-dynamic';

// 1. Initialiseer Google Cloud Storage Client (gebeurt op de Vercel server)
const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        // Belangrijk: vervang '\n' in de string om newlines correct te interpreteren
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
    },
});

const bucketName = process.env.GCP_BUCKET_NAME;

export async function POST(req: NextRequest) {
    if (!bucketName) {
        return NextResponse.json({ error: 'Bucketnaam is niet geconfigureerd in de omgeving.' }, { status: 500 });
    }
    
    try {
        // 2. Lees de inkomende FormData (nodig voor bestands-uploads)
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'Geen bestand gevonden.' }, { status: 400 });
        }

        // 3. Converteer bestand naar een Buffer en maak een unieke naam
        const buffer = Buffer.from(await file.arrayBuffer());
        // Maak een veilige bestandsnaam met tijdstempel om conflicten te voorkomen
        const safeFileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
        
        const bucket = storage.bucket(bucketName);
        const blob = bucket.file(safeFileName);

        // 4. Upload het bestand naar Google Cloud Storage
        await blob.save(buffer, {
            contentType: file.type || 'text/csv',
        });

        console.log(`Bestand ${safeFileName} succesvol geüpload naar GCS.`);

        // 5. Stuur een succesvol antwoord terug 
        return NextResponse.json({
            message: 'Bestand succesvol geüpload. Analyse wordt gestart.',
            fileName: safeFileName,
        }, { status: 200 });

    } catch (error) {
        console.error("Fout bij GCS upload:", error);
        return NextResponse.json(
            { error: 'Interne serverfout bij het uploaden.' }, 
            { status: 500 }
        );
    }
}