"use client";

import { useState } from "react";

export default function Home() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!domain.trim()) {
      setError("Por favor ingresa un dominio o URL");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/consulta-dominio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al consultar la API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">
          Consulta Dominio!
        </h1>

        <input
          type="text"
          placeholder="Ej: ejemplo.com o https://sitio.cl"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 mb-4"
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>

        {error && (
          <p className="text-red-600 text-sm text-center mt-3">{error}</p>
        )}

        {result && (
          <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h2 className="font-semibold mb-2">Resultado:</h2>

            {result.error ? (
              <p className="text-red-600">{result.error}</p>
                /* la api de google devuelve un cuerpo de respuesta con distinta información 
                SI ENCUENTRA UN RESULTADOS DE AMENAZA, sino, devuelve el body vacio
                en esta parte se pregunta si devuelve algo vacío o no, y si no es vacío, 
                devuelve las amenazas*/
            ) : (
              <>
                {result.matches && result.matches.length > 0 ? (
                  <ul className="list-disc ml-5">
                    {result.matches.map((match, index) => (
                      <li key={index}>
                        <strong>Amenaza:</strong> {match.threatType}
                        <br />
                        <strong>Plataforma:</strong>{" "}
                        {match.platformType || "Desconocida"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-700 font-medium">
                    ✅ El dominio no presenta amenazas conocidas.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
