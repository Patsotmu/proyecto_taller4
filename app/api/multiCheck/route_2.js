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

export async function POST(request) {
  const GOOGLE_API_KEY = "AIzaSyAaK3IKV2zx2nM0Ky3u_h3zHLbb8LNAIP0";
  const VT_API_KEY = "6ebf41befc4267204993a88816b751d4cac169b9677ed4681be1a0cdd8895628";
  const WHOISXML_API_KEY = "at_oO503Ns2uR6pb9tVJCJXov6ywOCuG";
  const URLSCAN_API_KEY = "019a547f-73af-739d-adb0-fd1588939732";
  const IPREPUTATION_API_KEY = "4c92204c1b43c5631387b3a6862cf30c92c834bebb9e970bc07d81f5404b6138001c65cfc3cb75c1";

  try {
    const body = await request.json();
    const url = body?.url;
    if (!url) return jsonResponse({ error: "Debes enviar { url: 'https://...' }" }, 400);

    const domain = extractDomain(url);
    const results = {};

    /*Google**/
    async function googleCheck(urlToCheck) {
      try {
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
        const unsafe = Boolean(data && data.matches && data.matches.length);
        return {
          flag: unsafe ? "F" : "V",
          message: unsafe
            ? "Detectado por Google Safe Browsing"
            : "Seguro según Google Safe Browsing",
          raw: data,
        };
      } catch (err) {
        return { flag: "N", message: `Error Google: ${err.message}`, raw: null };
      }
    }

    /*VIRUSTOTAAAAAAAAL*/
    async function virusTotalCheck(urlToCheck) {
      try {
        const form = new URLSearchParams();
        form.append("url", urlToCheck);
        const postRes = await fetch("https://www.virustotal.com/api/v3/urls", {
          method: "POST",
          headers: {
            "x-apikey": VT_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        });
        const postData = await postRes.json();
        if (!postData?.data?.id)
          return { flag: "N", message: "Error en envío a VirusTotal", raw: postData };
        const analysisId = postData.data.id;
        const getRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
          headers: { "x-apikey": VT_API_KEY },
        });
        const getData = await getRes.json();
        const stats = getData.data?.attributes?.stats;
        const malicious = stats?.malicious > 0;
        return {
          flag: malicious ? "F" : "V",
          message: malicious
            ? "VirusTotal detectó amenazas"
            : "VirusTotal no detecta amenazas",
          raw: getData,
        };
      } catch (err) {
        return { flag: "N", message: `Error VirusTotal: ${err.message}`, raw: null };
      }
    }

    /*SSL*/
    async function sslLabsCheck(domainToCheck) {
      try {
        const apiUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(domainToCheck)}&publish=false&all=done`;
        const start = Date.now();
        while (true) {
          const res = await fetch(apiUrl);
          const data = await res.json();
          if (data.status === "READY") {
            const endpoints = data.endpoints || [];
            const anyBad = endpoints.some(ep => !ep.grade?.startsWith("A"));
            return {
              flag: anyBad ? "F" : "V",
              message: `SSL Labs: ${endpoints.map(e => e.grade).join(", ")}`,
              raw: data,
            };
          } else if (data.status === "ERROR") {
            return { flag: "N", message: "SSL Labs error", raw: data };
          }
          if (Date.now() - start > 60000)
            return { flag: "N", message: "Timeout SSL Labs", raw: null };
          await new Promise(r => setTimeout(r, 3000));
        }
      } catch (err) {
        return { flag: "N", message: `Error SSL Labs: ${err.message}`, raw: null };
      }
    }

    /*whois*/
    async function whoisCheck(domainToCheck) {
      try {
        const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domainToCheck)}`);
        if (res.status === 404)
          return { flag: "N", message: "Dominio no encontrado (RDAP)", raw: null };
        const data = await res.json();
        const registered = Array.isArray(data.entities);
        return {
          flag: registered ? "V" : "N",
          message: registered
            ? "Dominio registrado según RDAP"
            : "Sin registro RDAP",
          raw: data,
        };
      } catch (err) {
        return { flag: "N", message: `Error WHOIS: ${err.message}`, raw: null };
      }
    }

    /*URL SCAN*/
    async function urlscanCheck(domainToCheck) {
      try {
        const res = await fetch("https://urlscan.io/api/v1/scan/", {
          method: "POST",
          headers: {
            "API-Key": URLSCAN_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: domainToCheck }),
        });
        const data = await res.json();
        return {
          flag: data.uuid ? "V" : "N",
          message: data.uuid
            ? "Analizado por URLScan.io"
            : "Error en URLScan.io",
          raw: data,
        };
      } catch (err) {
        return { flag: "N", message: `Error URLScan: ${err.message}`, raw: null };
      }
    }

    /*IP REPUTATION*/
    async function ipReputationCheck(urlToCheck) {
      try {
        const res = await fetch(
          `https://ipqualityscore.com/api/json/url/${IPREPUTATION_API_KEY}/${encodeURIComponent(urlToCheck)}`
        );
        const data = await res.json();
        const unsafe = data?.unsafe === true;
        return {
          flag: unsafe ? "F" : "V",
          message: unsafe
            ? "IPReputation marcó como peligroso"
            : "Seguro según IPReputation",
          raw: data,
        };
      } catch (err) {
        return { flag: "N", message: `Error IPReputation: ${err.message}`, raw: null };
      }
    }

    /*ALIEN VAULT(DOMAIN ESA VAINA)*/
    async function alienvaultCheck(domainToCheck) {
      try {
        const res = await fetch(
          `https://otx.alienvault.com/api/v1/indicators/domain/${encodeURIComponent(domainToCheck)}/general`
        );
        if (res.status === 404)
          return { flag: "N", message: "Sin datos en OTX", raw: null };
        const data = await res.json();
        const pulses = data?.pulse_info?.count || 0;
        const unsafe = pulses > 0;
        return {
          flag: unsafe ? "F" : "V",
          message: `AlienVault OTX reporta ${pulses} pulsos`,
          raw: data,
        };
      } catch (err) {
        return { flag: "N", message: `Error OTX: ${err.message}`, raw: null };
      }
    }

    /*******************
     * Ejecutar todo en paralelo
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
      ipReputationCheck(url),
      alienvaultCheck(domain),
    ]);

    results.googleSafeBrowsing = googleRes;
    results.virusTotal = vtRes;
    results.sslLabs = sslRes;
    results.whois = whoisRes;
    results.urlscan = urlscanRes;
    results.ipReputation = ipRepRes;
    results.domainReputation = otxRes;

    const anyF = Object.values(results).some(r => r?.flag === "F");
    const summary = {
      url,
      domain,
      suspicious: anyF,
      note: "flag: 'V'=seguro, 'F'=inseguro, 'N'=error",
    };

    return jsonResponse({ summary, results });
  } catch (err) {
    return jsonResponse({ error: "Error interno", detail: err.message }, 500);
  }
}
