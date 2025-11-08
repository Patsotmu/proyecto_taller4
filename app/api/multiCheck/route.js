// app/api/multiCheck/route.js

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./i, "");
  } catch (e) {
    return url;
  }
}

// --------------------
// Función de depuración: loggea y guarda un resumen legible
function logApiResult(apiName, data) {
  try {
    console.log("\n========================================");
    console.log(`🔍 Respuesta de ${apiName}:`);
    console.log("========================================");
    // intenta stringify formateado
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`❌ No se pudo loggear ${apiName}:`, err);
  }
}
// --------------------

export async function POST(request) {
  // === Inserta tus claves aquí o usa process.env ===
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyAaK3IKV2zx2nM0Ky3u_h3zHLbb8LNAIP0";
  const VT_API_KEY = process.env.VT_API_KEY || "6ebf41befc4267204993a88816b751d4cac169b9677ed4681be1a0cdd8895628";
  const WHOISXML_API_KEY = process.env.WHOISXML_API_KEY || "at_oO503Ns2uR6pb9tVJCJXov6ywOCuG";
  const URLSCAN_API_KEY = process.env.URLSCAN_API_KEY || "019a547f-73af-739d-adb0-fd1588939732";
  const IPREPUTATION_API_KEY = process.env.IPREPUTATION_API_KEY || "4c92204c1b43c5631387b3a6862cf30c92c834bebb9e970bc07d81f5404b6138001c65cfc3cb75c1";
  // ================================================================

  try {
    const body = await request.json();
    const url = body?.url;
    if (!url) return jsonResponse({ error: "Debes enviar { url: 'https://...' }" }, 400);

    const domain = extractDomain(url);
    const results = {};

    /*******************
     * 1) Google Safe Browsing
     *******************/
    async function googleCheck(urlToCheck) {
      try {
        if (!GOOGLE_API_KEY) {
          const r = { flag: "N", message: "Falta GOOGLE_API_KEY", raw: null };
          logApiResult("Google Safe Browsing", r);
          return r;
        }
        const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_API_KEY}`;
        const body = {
          client: { clientId: "multi-check-app", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: urlToCheck }],
          },
        };
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        logApiResult("Google Safe Browsing", data);
        const unsafe = Boolean(data && data.matches && data.matches.length);
        return {
          flag: unsafe ? "F" : "V",
          message: unsafe ? "Google Safe Browsing detectó coincidencias" : "Sin coincidencias en Google Safe Browsing",
          raw: data,
        };
      } catch (err) {
        const r = { flag: "N", message: `Error Google API: ${err.message}`, raw: null };
        logApiResult("Google Safe Browsing (error)", { message: err.message });
        return r;
      }
    }

    /*******************
     * 2) VirusTotal
     *******************/
    async function virusTotalCheck(urlToCheck) {
      try {
        if (!VT_API_KEY) {
          const r = { flag: "N", message: "Falta VT_API_KEY", raw: null };
          logApiResult("VirusTotal", r);
          return r;
        }
        const form = new URLSearchParams();
        form.append("url", urlToCheck);
        const postRes = await fetch("https://www.virustotal.com/api/v3/urls", {
          method: "POST",
          headers: { "x-apikey": VT_API_KEY, "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
        const postData = await postRes.json();
        logApiResult("VirusTotal - POST /urls", postData);
        if (!postData?.data?.id) {
          return { flag: "N", message: "Respuesta inesperada VirusTotal al enviar URL", raw: postData };
        }
        const analysisId = postData.data.id;
        const getRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
          headers: { "x-apikey": VT_API_KEY },
        });
        const getData = await getRes.json();
        logApiResult("VirusTotal - GET /analyses", getData);

        // interpretación
        let malicious = false;
        try {
          const stats = getData.data?.attributes?.stats;
          if (stats && typeof stats.malicious === "number") {
            malicious = stats.malicious > 0;
          } else {
            const engineDetections = getData.data?.attributes?.results || {};
            malicious = Object.values(engineDetections).some(v => v?.category === "malicious");
          }
        } catch (e) {
          malicious = false;
        }

        return {
          flag: malicious ? "F" : "V",
          message: malicious ? "VirusTotal indica detecciones" : "VirusTotal no reporta detecciones",
          raw: getData,
        };
      } catch (err) {
        const r = { flag: "N", message: `Error VirusTotal: ${err.message}`, raw: null };
        logApiResult("VirusTotal (error)", { message: err.message });
        return r;
      }
    }

    /*******************
     * 3) SSL Labs
     *******************/
    async function sslLabsCheck(domainToCheck) {
      try {
        const analyzeUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(domainToCheck)}&publish=false&all=done`;
        const start = Date.now();
        const timeoutMs = 60_000;
        while (true) {
          const res = await fetch(analyzeUrl);
          const data = await res.json();
          logApiResult("SSL Labs (poll)", data);
          if (data.status === "READY") {
            const endpoints = data.endpoints || [];
            const anyBad = endpoints.some(ep => !(ep.grade && ep.grade.toUpperCase().startsWith("A")));
            return {
              flag: anyBad ? "F" : "V",
              message: `SSL Labs: ${endpoints.map(e => e.grade).join(", ")}`,
              raw: data,
            };
          } else if (data.status === "ERROR") {
            return { flag: "N", message: `SSL Labs error`, raw: data };
          }
          if (Date.now() - start > timeoutMs) {
            return { flag: "N", message: "Timeout SSL Labs", raw: data };
          }
          await new Promise(r => setTimeout(r, 3000));
        }
      } catch (err) {
        logApiResult("SSL Labs (error)", { message: err.message });
        return { flag: "N", message: `Error SSL Labs: ${err.message}`, raw: null };
      }
    }

    /*******************
     * 4) Whois / RDAP
     *******************/
    async function whoisCheck(domainToCheck) {
      try {
        const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domainToCheck)}`);
        if (res.status === 404) {
          const r = { flag: "N", message: "RDAP no encontró el dominio", raw: null };
          logApiResult("Whois/RDAP", r);
          return r;
        }
        const data = await res.json();
        logApiResult("Whois/RDAP", data);
        const registered = Array.isArray(data.events) || Array.isArray(data.entities);
        return {
          flag: registered ? "V" : "N",
          message: registered ? "Dominio registrado (WHOIS/RDAP)" : "No hay info RDAP",
          raw: data,
        };
      } catch (err) {
        logApiResult("Whois/RDAP (error)", { message: err.message });
        return { flag: "N", message: `Error RDAP/Whois: ${err.message}`, raw: null };
      }
    }

    /*******************
     * 5) urlscan.io (search)
     *******************/
    async function urlscanCheck(domainToCheck) {
      try {
        const searchUrl = `https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(domainToCheck)}`;
        const res = await fetch(searchUrl);
        const data = await res.json();
        logApiResult("urlscan - search", data);
        // heurística: buscar tags sospechosos en resultados
        const hasResults = Array.isArray(data.results) && data.results.length > 0;
        const maliciousResults = data.results?.filter(r =>
          r.task?.tags?.some(tag => /malicious|phishing|scam|suspicious/i.test(tag))
        );
        const isMalicious = maliciousResults?.length > 0;
        return {
          flag: isMalicious ? "F" : "V",
          message: isMalicious ? `urlscan detectó ${maliciousResults.length} con etiquetas de riesgo` : `urlscan: ${hasResults ? data.results.length : 0} resultados, sin riesgo detectado`,
          raw: data,
        };
      } catch (err) {
        logApiResult("urlscan (error)", { message: err.message });
        return { flag: "N", message: `Error urlscan: ${err.message}`, raw: null };
      }
    }

    /*******************
     * 6) IP Reputation (Hackertarget + AbuseIPDB or IPQualityScore)
     *******************/
    async function ipReputationCheck(domainToCheck) {
      try {
        // Obtenemos IPs via hackertarget
        const dnsRes = await fetch(`https://api.hackertarget.com/dnslookup/?q=${encodeURIComponent(domainToCheck)}`);
        const dnsText = await dnsRes.text();
        logApiResult("hackertarget dnslookup (text)", dnsText);
        const ips = Array.from(dnsText.matchAll(/([0-9]{1,3}(?:\.[0-9]{1,3}){3})/g)).map(m => m[1]);
        if (!ips.length) {
          return { flag: "N", message: "No se obtuvieron IPs (dnslookup)", raw: dnsText };
        }

        // Intentamos IPQualityScore (si tienes key)
        if (IPREPUTATION_API_KEY) {
          const ipToCheck = ips[0];
          const res = await fetch(`https://ipqualityscore.com/api/json/ip/${IPREPUTATION_API_KEY}/${encodeURIComponent(ipToCheck)}`);
          const data = await res.json();
          logApiResult("IPQualityScore", data);
          const unsafe = !!data?.fraud_score && data.fraud_score > 20 || data?.bot_status === true || data?.proxy === true || data?.vpn === true;
          return {
            flag: unsafe ? "F" : "V",
            message: unsafe ? `IPQualityScore indica riesgo (fraud_score ${data.fraud_score})` : "IPQualityScore sin riesgo aparente",
            raw: data,
          };
        }

        // Si no hay key, devolvemos ips como raw
        return { flag: "N", message: "No hay API key para reputación IP", raw: { ips } };
      } catch (err) {
        logApiResult("ipReputation (error)", { message: err.message });
        return { flag: "N", message: `Error ipReputation: ${err.message}`, raw: null };
      }
    }

    /*******************
     * 7) AlienVault OTX
     *******************/
    async function alienvaultCheck(domainToCheck) {
      try {
        const res = await fetch(`https://otx.alienvault.com/api/v1/indicators/domain/${encodeURIComponent(domainToCheck)}/general`);
        if (res.status === 404) {
          const r = { flag: "N", message: "OTX no encontró datos", raw: null };
          logApiResult("AlienVault OTX", r);
          return r;
        }
        const data = await res.json();
        logApiResult("AlienVault OTX", data);
        const pulses = Array.isArray(data?.pulse_info?.pulses) ? data.pulse_info.pulses.length : (data?.pulse_info?.count || 0);
        const unsafe = pulses > 0;
        return {
          flag: unsafe ? "F" : "V",
          message: `OTX pulses: ${pulses}`,
          raw: data,
        };
      } catch (err) {
        logApiResult("AlienVault OTX (error)", { message: err.message });
        return { flag: "N", message: `Error OTX: ${err.message}`, raw: null };
      }
    }

    /*******************
     * Ejecutar checks en paralelo
     *******************/
    const [
      googleRes,
      vtRes,
      sslRes,
      whoisRes,
      urlscanRes,
      ipRepRes,
      otxRes,
    ] = await Promise.all([
      googleCheck(url),
      virusTotalCheck(url),
      sslLabsCheck(domain),
      whoisCheck(domain),
      urlscanCheck(domain),
      ipReputationCheck(domain),
      alienvaultCheck(domain),
    ]);

    results.googleSafeBrowsing = googleRes;
    results.virusTotal = vtRes;
    results.sslLabs = sslRes;
    results.whois = whoisRes;
    results.urlscan = urlscanRes;
    results.ipReputation = ipRepRes;
    results.domainReputation = otxRes;

    // Log final resumido
    console.log("\n---------- Resumen final ----------");
    for (const [k, v] of Object.entries(results)) {
      console.log(`${k}: flag=${v.flag} - ${v.message}`);
    }

    const anyF = Object.values(results).some(r => r?.flag === "F");
    const summary = {
      url,
      domain,
      suspicious: anyF,
      note: "flag: 'V'=seguro, 'F'=inseguro, 'N'=no consultado/error",
    };

    return jsonResponse({ summary, results });
  } catch (err) {
    console.error("Error general multiCheck:", err);
    return jsonResponse({ error: "Error interno", detail: err.message }, 500);
  }
}
