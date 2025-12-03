"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
  const [modalActivo, setModalActivo] = useState(null);

  const menuItemStyle = {
    marginBottom: '1rem',
    cursor: 'pointer',
    fontSize: '1.5rem',
  };

  const handleMenuClick = (opcion) => {
    setOpcionSeleccionada(opcion);
  }

  const menuOptions = [
      { key: 'about', label: 'Sobre Nosotros', content: "Somos tres estudiantes de la Universidad Austral de Chile con ganas de mejorar tu navegacion por internet." },
      { key: 'services', label: 'Servicios', content: "Ofrecemos validación de enlaces en tiempo real, análisis de amenazas y reportes detallados de seguridad." },
      { key: 'contact', label: 'Contacto', content: "Puedes contactarnos en knightlink@security.cl o llamando al +569 12345678." }
    ];

  async function analizarDominio(e) {
    if (e) e.preventDefault();
    if (!url.trim()) return alert("Ingrese un link válido.");

    try {
      setLoading(true);
      setResultado(null);
      setMostrarResultado(false);

      // Resultado de la API
      const rawRes = await fetch("/api/multiCheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const rawData = await rawRes.json();

      // Analisis hecho por openAI
      const aiRes = await fetch("/api/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rawData),
      });

      const aiData = await aiRes.json();
      setResultado(aiData);
      setMostrarResultado(true);
    }

    catch (error) {
      console.error(error);
      setResultado({ error: "Error analizando el dominio" });
    }

    finally {
      setLoading(false);
    }
  }

  function getRiskColor(n) {
    if (n <= 2) return "#ff4444";   // rojo
    if (n === 3) return "#ffaa00";  // amarillo
    return "#00cc66";               // verde
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      }}
    >
      <header
        style={{
          backgroundColor: '#132968',
          color: '#fff',
          padding: '1rem 2rem',
          fontSize: '1.8rem',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          Knight Link 
        </div>

        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Abrir menú"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            width: '30px',
            height: '24px',
            padding: 0,
          }}
        >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '30px',
              height: '3px',
              backgroundColor: 'white',
              borderRadius: '2px',
              transition: 'all 0.3s linear',
              transformOrigin: '1px',
              marginBottom: '5px',
            }}
          />
        ))}
        </button>
      </header>
      
      {/* Menu Lateral */}
      {menuAbierto && (
        <nav
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '325px',
            height: '100vh',
            backgroundColor: '#0D1A42',
            color: '#fff',
            padding: '2rem',
            boxShadow: '-2px 0 5px rgba(0,0,0,0.5)',
            zIndex: 20,
          }}
        >
          <ul 
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}
          >
            {menuOptions.map((option) => (
              <div 
                key={option.key}
              >
                <li
                  style={menuItemStyle}
                  onClick={() => handleMenuClick(option.key)}
                >
                  <span style={{
                    cursor: 'pointer'
                    }}
                  >
                    {option.label}
                  </span>
                </li>
            
                {opcionSeleccionada === option.key && (
                  <li
                    style={{
                      padding: '0.5rem 0 1rem 1rem',
                      listStyle: 'none',
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    {Array.isArray(option.content) ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {option.content.map((item, index) => (
                          <li
                            key={index}
                            style={{
                              fontSize: '0.9rem',
                              marginBottom: '0.5rem'
                            }}
                          >
                            {/* Si es un objeto con un nombre, solo mostramos texto normal */}
                            {typeof item === 'object' && item !== null && item.name ? (
                              <div>
                                <strong
                                  style={{
                                    color: '#E57373'
                                  }}
                                >
                                  {item.name}
                                </strong>
                              </div>
                            ) : (
                              <span 
                                style={{
                                  color: 'white'
                                }}
                              >
                                {item}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span 
                        style={{
                          fontSize: '0.9rem',
                          color: 'white'
                        }}
                      >
                        {option.content}
                      </span>
                    )}
                  </li>
                )}
              </div>
            ))}
          </ul>
          
          <button
            onClick={() => setMenuAbierto(false)}
            style={{
              fontSize: '1rem',
              marginTop: '2rem',
              backgroundColor: '#13296B',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#0d1f4d')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#13296B')
            }
          >
            Cerrar
          </button>
        </nav>
      )}

      <main
        style={{
          flex: 1,
          backgroundColor: '#0D1A42',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',

          justifyContent: mostrarResultado ? 'flex-start' : 'center',
          paddingTop: mostrarResultado ? '5rem' : '0'
        }}
      >

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            analizarDominio();
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            alignItems: "center",
            width: "100%",
          }}
        >
          <input
            type="text"
            placeholder="www.link.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              backgroundColor: 'white',
              padding: "0.8rem",
              fontSize: "1.3rem",
              width: "600px",
              maxWidth: "90%",
              borderRadius: "8px",
              border: "none",
              outline: "none",
              color: '#333',
            }}
          />
        </form>

        <p 
          style={{
            opacity: 0.7,
            fontSize: "1.1rem",
            marginTop: "1rem"
          }}
        >
          Ingrese un link para comprobar su seguridad
        </p>

        <button
          onClick={analizarDominio}
          disabled={loading}
          style={{
            padding: "0.8rem 1.5rem",
            fontSize: "1.5rem",
            backgroundColor: loading ? "##0d1f4d" : "#13296B",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
            marginTop: '1.5rem',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = '#0d1f4d')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = '#13296B')
          } 
        >
          {loading ? "Analizando..." : "Buscar"}
        </button>

        {mostrarResultado && (
          <div
            style={{
              textAlign: 'center',
              color: 'white',
              marginTop: '3rem'
            }}
          >
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                margin: '0 0 1,5rem 0'
              }}
            >
              Resultado
            </h2>

            <button
              style={{
                // Colores
                backgroundColor: resultado?.es_seguro === "sí" ? "#4FD8F0" : "#CC371B",
                color: resultado?.es_seguro === "sí" ? "#13296B" : "white",
                padding: '0.75rem 2rem',
                fontSize: '1.2rem',
                fontWeight: '700',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '1rem auto 1.5rem auto',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
              }}
            >
              {/* Texto e icono  */}
              {resultado?.es_seguro === "sí" ? 'Link seguro' : 'Link peligroso'}
              <span
                style={{
                  marginLeft: '10px'
                }}
              >
                {resultado?.es_seguro === "sí" ? '✅' : '⚠️'}
              </span> 
            </button>

            {/* Boton de Resumen */}
            <button onClick={() => setModalActivo('resumen')}
              style={{
                backgroundColor: 'white',
                color: 'black',
                padding: '0.5rem 3.8rem',
                borderRadius: '6px',
                margin: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'grey')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'white')
              }
            >
              Resumen
            </button>

            {/* Boton de Mas Informacion */}
            <button onClick={() => setModalActivo('tecnica')}
              style={{
                backgroundColor: 'white',
                color: 'black',
                padding: '0.5rem 1.5rem',
                borderRadius: '6px',
                margin: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.3s ease',
              }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'grey')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'white')
                }
            >
              Información técnica
            </button>
          </div>
        )}
      </main>

      {modalActivo && (
        <div
          style={{
            //Fondo oscuro semitransparente
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 50,
          }}
        >
          {/* Ventana blanca del modal */}
          <div
            style={{
              backgroundColor: 'white',
              color: 'black',
              padding: '2rem',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              zIndex: 51
            }}
          >
            {/* Contenido dinamico del Modal */}
            {modalActivo === 'resumen' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem'}}> Nivel de Seguridad (1 - 5)</h3>
                <p style={{ fontWeight: 'bold', fontSize: '2rem', marginBottom: '1rem'}}>{resultado.seguridad}</p>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}> Resultado </h3>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem'}}>{resultado.razón}</p>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Factores principales:</h3>
                <ul style={{ fontSize: '1.1rem', marginBottom: '1rem'}}>
                  {resultado.factores_principales.map((f, i) => (
                    <li key={i}>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {modalActivo === 'tecnica' && (
              <div>
                <h3 style={{ color: "#black" }}>JSON completo</h3>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    padding: "1rem",
                    borderRadius: "6px",
                    color: "#black",
                    fontSize: "1rem",
                  }}
                >
                  {JSON.stringify(resultado, null, 2)}
                </pre>
              </div>
            )}

            {/* Boton para cerrar el modal */}
            <button
              onClick={() => setModalActivo(null)}
              style={{
                backgroundColor: '#13296B',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '1rem',
                float: 'right'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
