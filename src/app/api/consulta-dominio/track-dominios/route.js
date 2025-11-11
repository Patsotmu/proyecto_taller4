// app/api/track-domain/route.js

import { NextResponse } from 'next/server';
import { updateAndSortDomain } from '@/lib/googleSheets';


export async function POST(request) {
  try {
    // 1. Obtener los datos del cuerpo de la solicitud (enviados desde el cliente)
    const { domain, securityLevel } = await request.json();

    if (!domain || !securityLevel) {
      return NextResponse.json(
        { success: false, message: 'Faltan parámetros: domain y securityLevel son requeridos.' },
        { status: 400 }
      );
    }

    // 2. Llamar a la lógica de Google Sheets para actualizar y ordenar
    const result = await updateAndSortDomain(domain, securityLevel);

    // 3. Responder al cliente
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: result.message 
    });

  } catch (error) {
    console.error('Error en el Route Handler track-domain:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor al registrar la búsqueda.' }, 
      { status: 500 }
    );
  }
}