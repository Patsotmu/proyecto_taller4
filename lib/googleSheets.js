// lib/googleSheets.js

import { google } from 'googleapis';

// ***************************************************************
// CONFIGURACIÓN: Reemplaza con tus valores
// ***************************************************************
// ID de tu Google Sheet (obtenido de la URL)
export const SPREADSHEET_ID = '1KW03VxvyGi9rjWFkfT4_SN9GLQ-gXQ6TjFBAxZPYkqc'; 
// Nombre de la pestaña de la hoja de cálculo
const SHEET_NAME = 'Dominios'; 
// Rango completo que utilizaremos (Columna A:C)
const RANGE = `${SHEET_NAME}!A:C`; 
// ***************************************************************

// 1. AUTENTICACIÓN: Carga y configura el cliente de Google.
let auth;
let credentials;

try {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY no está definida en .env.local');
  }
  
  // Se asume que el JSON ya está en una sola línea en .env.local
  credentials = JSON.parse(key);

  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

} catch (e) {
  // Captura errores si el JSON es inválido o la variable falta
  console.error('--- ERROR CRÍTICO EN AUTENTICACIÓN DE GOOGLE SHEETS ---');
  console.error('Verifica el formato de GOOGLE_SERVICE_ACCOUNT_KEY en .env.local.');
  console.error('Debe ser un JSON válido, sin saltos de línea (usar \\n) y entre comillas simples.');
  console.error('Detalle del error:', e.message);
  // Asignar null para evitar que el servidor se caiga inmediatamente
  auth = null; 
}


export async function getSheetsClient() {
  if (!auth) {
      throw new Error('La autenticación de Google Sheets falló durante la inicialización.');
  }
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  return sheets;
}

/**
 * 2. LÓGICA CENTRAL: Actualiza el contador de un dominio y reordena
 * toda la hoja para mantener los más buscados arriba.
 * @param {string} domain El nombre del dominio (ej: "google.com")
 * @param {string} securityLevel El nivel de seguridad (ej: "Bajo")
 * @returns {object} El resultado de la operación
 */
export async function updateAndSortDomain(domain, securityLevel) {
  try {
    const sheets = await getSheetsClient();

    // 2.1. LECTURA: Obtener todos los datos de la hoja
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    // Los valores incluyen el encabezado.
    let values = response.data.values || [];
    const header = values.length > 0 ? values[0] : ['Dominio', 'Busquedas', 'Nivel'];
    let dataRows = values.slice(1); // Datos sin el encabezado

    let foundIndex = -1;

    // 2.2. BÚSQUEDA Y ACTUALIZACIÓN: Iterar para encontrar el dominio
    for (let i = 0; i < dataRows.length; i++) {
      const [name, searches, level] = dataRows[i];
      
      if (name === domain) {
        foundIndex = i;
        // Columna B (Busquedas) está en el índice [1]
        let currentSearches = parseInt(searches || 0, 10); 
        
        // Sumar +1 a las búsquedas
        dataRows[i][1] = currentSearches + 1; 
        
        // Actualizar el Nivel de Seguridad (Columna C, índice [2])
        dataRows[i][2] = securityLevel;
        break; 
      }
    }

    // 2.3. SI NO SE ENCUENTRA: Añadir una nueva fila
    if (foundIndex === -1) {
      dataRows.push([domain, 1, securityLevel]);
    }
    
    // 2.4. ORDENAMIENTO: Ordenar por la Columna B (Búsquedas, índice 1) de forma descendente.
    dataRows.sort((a, b) => {
      // Intentar convertir a número para una comparación correcta
      const searchesA = parseInt(a[1] || 0, 10);
      const searchesB = parseInt(b[1] || 0, 10);
      
      // Orden descendente (b - a)
      return searchesB - searchesA; 
    });

    // 2.5. REESCRITURA: Reconstruir la matriz de valores con el encabezado y los datos ordenados.
    const newValues = [header, ...dataRows];

    // 2.6. ESCRITURA: Sobrescribir todos los datos en la hoja.
    // Esto garantiza que los 10 más buscados (o todos) estén ordenados al inicio.
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE, // Reescribe desde A:C
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: newValues,
      },
    });

    const finalSearches = newValues.find(row => row[0] === domain)?.[1] || 1;
    
    return {
        success: true, 
        searches: finalSearches, 
        message: 'Dominio actualizado y hoja reordenada con éxito.' 
    };

  } catch (error) {
    // Agregar log detallado para debugging.
    console.error('--- ERROR GOOGLE SHEETS API (updateAndSortDomain) ---');
    if (error.code && error.message) {
        console.error(`Código HTTP: ${error.code}. Mensaje: ${error.message}`);
        console.error('Causa probable: Credenciales, permisos de la hoja o ID/Nombre incorrecto.');
    } else {
        console.error('Error desconocido:', error);
    }
    // ------------------------------------------------------------------
    throw new Error('Failed to communicate with Google Sheets API.');
  }
}

/**
 * 3. FUNCIÓN DE LECTURA: Lee y devuelve el Top N de dominios (asumiendo que están ordenados).
 * @param {number} limit El número de dominios a devolver (e.g., 10).
 * @returns {Array<object>} Un array de objetos con el Top N.
 */
export async function getTopDomains(limit = 10) {
    try {
        const sheets = await getSheetsClient();
        
        // Leer el encabezado + el número de filas solicitadas (ej: A1:C11 para Top 10)
        const SHEET_NAME = 'Dominios'; 
        const rangeToRead = `${SHEET_NAME}!A1:C${limit + 1}`; 

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: rangeToRead,
        });

        const values = response.data.values || [];
        if (values.length < 2) {
            return []; // Solo hay encabezado o está vacía
        }

        const [header, ...topRows] = values;
        
        // Mapear los datos a objetos JSON para un uso más fácil en el frontend
        const topDomains = topRows.map(row => ({
            domain: row[0] || '',
            searches: parseInt(row[1] || 0, 10),
            securityLevel: row[2] || 'Desconocido',
        }));

        return topDomains;

    } catch (error) {
        // Agregar log detallado para debugging.
        console.error('--- ERROR GOOGLE SHEETS API (getTopDomains) ---');
        if (error.code && error.message) {
            console.error(`Código HTTP: ${error.code}. Mensaje: ${error.message}`);
            console.error('Causa probable: Credenciales, permisos de la hoja o ID/Nombre incorrecto.');
        } else {
            console.error('Error desconocido:', error);
        }
        // ------------------------------------------------------------------
        // Devolver un array vacío en caso de fallo de comunicación
        return [];
    }
}