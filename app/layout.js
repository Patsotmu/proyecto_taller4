//  Importa la función de fuente optimizada de Next.js
import { Open_Sans } from 'next/font/google';

import './globals.css'; 

//  Configura la fuente Open Sans
const openSans = Open_Sans({
  weight: ['400', '700'], 
  subsets: ['latin'],
  variable: '--font-open-sans', 
});

// Metadatos básicos
export const metadata = {
  title: 'Domain Security App',
  description: 'Aplicación para comprobar la seguridad de enlaces.',
};

export default function RootLayout({ children }) {
  return (
    //  Aplica la variable CSS de la fuente a la etiqueta <html>
    <html lang="es" className={`${openSans.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}