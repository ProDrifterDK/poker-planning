import ClientHomePage from './components/ClientHomePage';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <ClientHomePage lang={lang} />
  );
}