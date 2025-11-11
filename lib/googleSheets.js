import { google } from 'googleapis';

// Parsear la clave JSON desde la variable de entorno
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

const auth = new google.auth.GoogleAuth({
  credentials,
  // Permiso para hojas de cálculo
  scopes: ['https://www.googleapis.com/auth/spreadsheets'], 
});

// Función para obtener el cliente de la API
export async function getSheetsClient() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  
  return sheets;
}

// ID hoja de cálculo
export const SPREADSHEET_ID = '1KW03VxvyGi9rjWFkfT4_SN9GLQ-gXQ6TjFBAxZPYkqc';