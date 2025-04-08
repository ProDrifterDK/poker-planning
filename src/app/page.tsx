import { redirect } from 'next/navigation';

// Redirigir a la ruta con el idioma por defecto
export default function Home() {
  redirect('/es');
}
