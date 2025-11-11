import { NextResponse } from 'next/server';
import { getTopDomains } from '@/lib/googleSheets';

export async function GET() {
  try {
    const TOP_LIMIT = 10;
    
    // 1. Llamar a la función que lee el Top N de la hoja
    // Esta función está definida en lib/googleSheets.js
    const topDomains = await getTopDomains(TOP_LIMIT);

    // 2. Responder al cliente con los datos en formato JSON
    // El frontend recibirá { success: true, data: [...] }
    return NextResponse.json({ 
      success: true, 
      data: topDomains, // Contiene el array de 10 dominios mapeados
    });

  } catch (error) {
    // Manejar errores en la comunicación con Google Sheets
    console.error('Error al obtener el Top 10 de dominios:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error al obtener la lista de dominios.' }, 
      { status: 500 }
    );
  }
}