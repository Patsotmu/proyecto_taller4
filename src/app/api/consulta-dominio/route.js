import { NextResponse } from "next/server";

export async function POST(req) {
  console.log("🔑 GOOGLE_SAFE_BROWSING_KEY:", process.env.GOOGLE_SAFE_BROWSING_KEY);

  try {
    const { domain } = await req.json();
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;

    if (!domain) {
      return NextResponse.json({ error: "No se proporcionó un dominio" }, { status: 400 });
    }

    const url = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

    const body = {
      client: {
        clientId: "nextjs-safe-browsing-demo",
        clientVersion: "1.0.0",
      },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION",
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url: domain }],
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 👇 Aquí controlamos si Google devolvió algo que no es JSON
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({
        error: "La respuesta de Google no es JSON válido.",
        raw: text,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en /api/consulta-dominio:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
