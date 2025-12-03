export const runtime = "nodejs";

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}



function reducirJson(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (Array.isArray(value) && value.length > 50) return "[TRUNCADO]";
      if (typeof value === "string" && value.length > 500) return value.slice(0, 500) + "…";
      return value;
    })
  );
}



function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}



//google
async function checkGoogle(url) {
  try {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
    const body = {
      client: { clientId: "multiCheck", clientVersion: "1.0" },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }],
      },
    };

    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await res.json();

    return {
      flag: data.matches ? "F" : "V",
      message: data.matches ? "Google Safe Browsing detectó amenaza" : "Sin amenazas detectadas",
      raw: reducirJson(data),
    };
  } catch (err) {
    return { flag: "N", message: "Error en Google Safe Browsing", raw: String(err) };
  }
}



//VT
async function checkVirusTotal(url) {
  try {
    const apiKey = process.env.VIRUSTOTAL_KEY;
    const id = encodeURIComponent(url);
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, {
      headers: { "x-apikey": apiKey },
    });

    const data = await res.json();

    const malicious = data?.data?.attributes?.last_analysis_stats?.malicious ?? 0;

    return {
      flag: malicious > 0 ? "F" : "V",
      message: malicious > 0 ? "VirusTotal reportó detecciones" : "Sin detecciones",
      raw: reducirJson(data),
    };
  } catch (err) {
    return { flag: "N", message: "Error en VirusTotal", raw: String(err) };
  }
}



//WHOIS
async function checkWhois(domain) {
  try {
    const apiKey = process.env.WHOISXML_KEY;

    const res = await fetch(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`
    );

    const data = await res.json();

    return {
      flag: "V",
      message: "WHOIS consultado",
      raw: reducirJson(data),
    };
  } catch {
    return { flag: "N", message: "Error en WHOIS", raw: "" };
  }
}


//URL
async function checkUrlScan(url) {
  try {
    const apiKey = process.env.URLSCAN_KEY;

    const res = await fetch(`https://urlscan.io/api/v1/scan/`, {
      method: "POST",
      headers: { "API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ url: url, visibility: "private" }),
    });

    const data = await res.json();

    return {
      flag: data?.message?.includes("Submission successful") ? "V" : "N",
      message: data?.message || "Respuesta recibida",
      raw: reducirJson(data),
    };
  } catch (err) {
    return { flag: "N", message: "Error en URLScan", raw: String(err) };
  }
}




//IP
async function checkIP(ip) {
  try {
    const apiKey = process.env.IPQUALITY_KEY;

    const res = await fetch(
      `https://ipqualityscore.com/api/json/ip/${apiKey}/${ip}`
    );

    const data = await res.json();

    const fraudScore = data.fraud_score ?? 0;

    return {
      flag: fraudScore > 50 ? "F" : "V",
      message: fraudScore > 50 ? "IP riesgosa" : "IP limpia",
      raw: reducirJson(data),
    };
  } catch (err) {
    return { flag: "N", message: "Error verificando IP", raw: String(err) };
  }
}



//Alien-Domain
async function checkOTX(domain) {
  try {
    const apiKey = process.env.OTX_KEY;
    const res = await fetch(`https://otx.alienvault.com/api/v1/indicators/domain/${domain}/general`, {
      headers: { "X-OTX-API-KEY": apiKey },
    });

    const data = await res.json();

    const pulses = data?.pulse_info?.count ?? 0;

    return {
      flag: pulses > 0 ? "F" : "V",
      message: pulses > 0 ? "Dominio en pulses de OTX" : "Sin registros peligrosos",
      raw: reducirJson(data),
    };
  } catch (err) {
    return { flag: "N", message: "Error en OTX", raw: String(err) };
  }
}




export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return jsonResponse({ error: "Falta URL" }, 400);

    const domain = extractDomain(url);
    const ip = domain;

    const [g, vt, whois, urlscan, iprep, otx] = await Promise.all([
      checkGoogle(url),
      checkVirusTotal(url),
      checkWhois(domain),
      checkUrlScan(url),
      checkIP(ip),
      checkOTX(domain),
    ]);

    return jsonResponse({
      url,
      domain,
      results: {
        google: g,
        virusTotal: vt,
        whois,
        urlscan,
        ipReputation: iprep,
        otx,
      },
    });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
}
