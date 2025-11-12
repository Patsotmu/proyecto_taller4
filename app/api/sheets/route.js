import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEETS_ID;

    if (!clientEmail || !privateKey || !sheetId) {
      throw new Error("Missing Google Sheets environment variables");
    }

    const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes,
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const range = 'Hoja1!A1:C4'; // Ajusta 'Hoja1' al nombre de tu hoja

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const values = response.data.values;

    return NextResponse.json({ data: values });

  } catch (error) {
    console.error("Error fetching sheets data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch data from Google Sheets", details: errorMessage }, { status: 500 });
  }
}