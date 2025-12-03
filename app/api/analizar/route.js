import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req) {
  try {
    const body = await req.json();
    const allData = body;

    const systemPrompt = `
Eres un analista experto en ciberseguridad.

Recibirás un objeto JSON que contiene salidas ya reducidas de:
- Google Safe Browsing
- VirusTotal
- WHOIS / RDAP
- URLScan.io
- IPQualityScore
- AlienVault OTX

REGLAS:
- Analiza solo lo que aparece en los JSON reducidos.
- No inventes nada.
- Puntúa riesgo: 1 = muy peligroso, 5 = muy seguro.
- Devuelve solo JSON válido.

Formato exacto:

{
  "seguridad": <1-5>,
  "es_seguro": "<sí/no>",
  "razón": "<explicación simple>",
  "factores_principales": []
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Datos de reputación del dominio:\n\n" +
            JSON.stringify(allData, null, 2),
        },
      ],
    });

    const text = completion.choices[0].message.content;

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Error IA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
