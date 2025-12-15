import Head from 'next/head';
import '../app/globals.css';
import OnboardingPlatform from '../components/OnboardingPlatform';

export default function Home() {
  return (
    <>
      <Head>
        <title>Plateforme d'Intégration RH - Bienvenue</title>
        <meta name="description" content="Système de gestion complète pour l'intégration des nouveaux employés" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <OnboardingPlatform />
    </>
  );
}
