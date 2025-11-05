'use client';
import { useState } from 'react';

export default function Home() {
    const [texto, setTexto] = useState('');
    const [menuAbierto, setMenuAbierto] = useState(false);
    
    const handleClick = () => {
        alert(`Texto ingresado: ${texto}`);
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
            <div style={{ fontFamily: "'Open Sans', sans-serif"}}>
                Domain Security
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

        {menuAbierto && (
        <nav
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '250px',
            height: '100vh',
            backgroundColor: '#0D1A42',
            color: '#fff',
            padding: '2rem',
            boxShadow: '-2px 0 5px rgba(0,0,0,0.5)',
            zIndex: 20,
          }}
        >
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '1rem', cursor: 'pointer' }}>Inicio</li>
            <li style={{ marginBottom: '1rem', cursor: 'pointer' }}>Sobre Nosotros</li>
            <li style={{ marginBottom: '1rem', cursor: 'pointer' }}>Servicios</li>
            <li style={{ marginBottom: '1rem', cursor: 'pointer' }}>Contacto</li>
          </ul>
          <button
            onClick={() => setMenuAbierto(false)}
            style={{
              marginTop: '2rem',
              backgroundColor: '#13296B',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
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
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="https://url.com"
            style={{
              padding: '0.5rem',
              fontSize: '2rem',
              width: '600px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              outline: 'none',
              color: '#333',
              marginBottom: '10rem',
            }}
          />
          <button
            onClick={handleClick}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '2rem',
              backgroundColor: '#13296B',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              marginBottom: '10rem',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#0d1f4d')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#13296B')
            }
          >
            Buscar
          </button>
        </div>
      </main>
    </div>
  );
}