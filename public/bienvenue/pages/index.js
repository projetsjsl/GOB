import Head from 'next/head';
import '../app/globals.css';
import OnboardingPlatform from '../components/OnboardingPlatform';

export default function Home() {
  return (
    <>
      <Head>
        <title>Plateforme d'Integration RH - Bienvenue</title>
        <meta name="description" content="Systeme de gestion complete pour l'integration des nouveaux employes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <OnboardingPlatform />
    </>
  );
}
