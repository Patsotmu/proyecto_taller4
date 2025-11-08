'use client';
import { useState } from 'react';

export default function Home() {
    const [texto, setTexto] = useState('');
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [mostrarResultado, setMostrarResultado] = useState(false); 
    const [esSeguro, setEsSeguro] = useState(true);
    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
    const [cargando, setCargando] = useState(false); 

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
      { key: 'contact', label: 'Contacto', content: "Puedes contactarnos en domainsecurity@gmail.com o llamando al +569 12345678." },
      { 
        key: 'risky_pages',
        label: 'Páginas peligrosas', 
        content: [
          {name: 'nombre1', href: 'link1'},
          {name: 'nombre2', href: 'link2'},
          {name: 'nombre3', href: 'link3'}
        ]
      }
    ];

    const handleBuscarDominio = async () => {
  if (!texto.trim()) {
    alert("Por favor, ingrese una URL válida.");
    setMostrarResultado(false);
    return;
  }

  try {
    // Llamamos al backend en /api/multiCheck
    const response = await fetch('/api/multiCheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: texto }),
    });

    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    // Evaluamos si alguna API marcó 'F' (peligroso)
    const esSeguro = !data.summary.suspicious;

    setEsSeguro(esSeguro);
    setMostrarResultado(true);

  } catch (error) {
    console.error('Error al verificar dominio:', error);
    alert('Ocurrió un error al verificar el dominio.');
  }
};


    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header
                style={{
                    backgroundColor: '#13296B',
                    color: '#fff',
                    padding: '1rem 2rem',
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div>Domain Security</div>

                {/* Botón de menu */}
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
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {menuOptions.map((option) => (
                      <div key={option.key}>
                        <li
                          style={menuItemStyle}
                          onClick={() => handleMenuClick(option.key)}
                        >
                          <span style={{ cursor: 'pointer' }}>{option.label}</span>
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
                                    style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}
                                  >
                                    {typeof item === 'object' && item !== null && item.name ? (
                                      <div>
                                        <strong style={{ color: '#E57373' }}>{item.name}:</strong> 
                                        <a 
                                          href={item.href} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          style={{ 
                                            color: '#A0C4FF', 
                                            textDecoration: 'none', 
                                            fontSize: '0.8rem',
                                            marginLeft: '0.5rem',
                                            wordBreak: 'break-all'
                                          }}
                                        >
                                          {item.href}
                                        </a>
                                      </div>
                                    ) : (
                                      <span style={{ cursor: 'pointer', color: 'white' }}>{item}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span style={{ fontSize: '0.9rem', color: 'white' }}>{option.content}</span>
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

            {/* Pantalla principal */}
            <main
                style={{
                    flex: 1,
                    backgroundColor: '#0D1A42',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: mostrarResultado ? 'flex-start' : 'center', 
                    paddingTop: mostrarResultado ? '5rem' : '0', 
                }}
            >
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    marginBottom: '2rem', 
                    flexDirection: 'column',
                  }}
                >
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleBuscarDominio();
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                  >
                        <input
                            type="text"
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            placeholder="https://link.com"
                            style={{
                                padding: '0.5rem',
                                fontSize: '2rem',
                                backgroundColor: 'white',
                                width: '600px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                outline: 'none',
                                color: '#333',
                            }}
                        />

                        <button
                            onClick={handleBuscarDominio}
                            disabled={cargando}
                            style={{
                                padding: '0.6rem 1rem',
                                fontSize: '2rem',
                                backgroundColor: cargando ? '#666' : '#13296B',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: cargando ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.3s ease',
                            }}
                        >
                            {cargando ? 'Analizando...' : 'Buscar'}
                        </button>
                    </form>

                    <p style={{ 
                        color: 'white', 
                        opacity: 0.7, 
                        fontSize: '1.5rem', 
                        margin: 0, 
                        alignSelf: 'flex-start' 
                      }}
                    >
                      Ingrese un link para comprobar su seguridad
                    </p>
                </div>

                {mostrarResultado && (
                    <div 
                        style={{ 
                            textAlign: 'center', 
                            color: 'white', 
                            marginTop: '3rem',
                        }}
                    >
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 1.5rem 0' }}>
                            Resultado
                        </h2>
                        
                        <button
                            style={{
                                backgroundColor: esSeguro ? '#4FD8F0' : '#CC371B', 
                                color: esSeguro ? '#13296B' : 'white', 
                                padding: '0.75rem 2rem',
                                fontSize: '1.2rem',
                                fontWeight: '700',
                                border: 'none',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                            }}
                        >
                            {esSeguro ? 'Link seguro' : 'Link peligroso'}
                            <span style={{ marginLeft: '10px' }}>{esSeguro ? '✅' : '⚠️'}</span> 
                        </button>

                        <button style={{
                            backgroundColor: 'white',
                            color: 'black',
                            padding: '0.5rem 3.8rem',
                            borderRadius: '6px',
                            margin: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                        }}>
                          Resumen
                        </button>
                        
                        <button style={{
                            backgroundColor: 'white',
                            color: 'black',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '6px',
                            margin: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                        }}>
                          Información técnica
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
