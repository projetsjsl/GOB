import React from 'react';
import { XMarkIcon, BookOpenIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface GuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideDialog: React.FC<GuideDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <BookOpenIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Guide : Réduire les N/A et Actualiser les Profils
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Comment réduire le nombre de tickers affichant "N/A" dans le KPI Dashboard
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none">
          {/* Objectif */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-600" />
              Objectif
            </h3>
            <p className="text-gray-700">
              Réduire le nombre de tickers affichant "N/A" dans le KPI Dashboard en synchronisant et nettoyant les profils.
            </p>
          </section>

          {/* Causes des N/A */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
              Causes des N/A
            </h3>
            <p className="text-gray-700 mb-3">
              Les tickers affichent "N/A" pour JPEGY et "-100%" pour le rendement lorsque :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Profils non synchronisés</strong> : Pas encore chargés depuis l'API FMP
                <ul className="list-circle list-inside ml-4 mt-1 text-sm text-gray-600">
                  <li>Solution : Synchroniser depuis Supabase puis actualiser depuis FMP</li>
                </ul>
              </li>
              <li><strong>Données invalides</strong> :
                <ul className="list-circle list-inside ml-4 mt-1 text-sm text-gray-600">
                  <li>Prix actuel invalide (≤ 0)</li>
                  <li>EPS = 0 ou invalide</li>
                  <li>Croissance EPS + Yield ≤ 0.01%</li>
                  <li>Aucune donnée financière valide</li>
                </ul>
              </li>
              <li><strong>Fonds mutuels</strong> : Maintenant automatiquement filtrés</li>
              <li><strong>Tickers obsolètes</strong> : Données trop anciennes ou corrompues</li>
            </ul>
          </section>

          {/* Solutions */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              Solutions
            </h3>

            {/* Option 1 */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r">
              <h4 className="font-bold text-blue-900 mb-2">Option 1 : Synchronisation en Masse (RECOMMANDÉ)</h4>
              <p className="text-blue-800 text-sm mb-3">
                <strong>Dans l'application Finance Pro 3p1 :</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm ml-2">
                <li>Ouvrez la sidebar (menu hamburger)</li>
                <li>Cliquez sur <strong>"Sync Tous les Tickers"</strong> (bouton vert)</li>
                <li>Confirmez la synchronisation</li>
                <li>Attendez la fin du processus (peut prendre plusieurs minutes)</li>
              </ol>
              <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-2">Ce que fait la synchronisation :</p>
                <ul className="list-check list-inside space-y-1 text-xs text-blue-800">
                  <li>✅ Crée un snapshot de sauvegarde avant chaque sync</li>
                  <li>✅ Met à jour les données depuis FMP</li>
                  <li>✅ Préserve vos modifications manuelles</li>
                  <li>✅ Recalcule les hypothèses automatiquement</li>
                  <li>✅ Détecte et exclut les métriques aberrantes</li>
                </ul>
              </div>
            </div>

            {/* Option 2 */}
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-r">
              <h4 className="font-bold text-green-900 mb-2">Option 2 : Synchronisation avec Critères</h4>
              <p className="text-green-800 text-sm mb-3">
                <strong>Dans l'onglet KPI :</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 text-green-800 text-sm ml-2">
                <li>Cliquez sur <strong>"Sync avec critères"</strong> (bouton bleu)</li>
                <li>Choisissez un critère :
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><strong>Tous les tickers</strong> - Synchronise tout</li>
                    <li><strong>Portefeuille (étoiles)</strong> - Uniquement les tickers du portefeuille</li>
                    <li><strong>Watchlist (œil)</strong> - Uniquement la watchlist</li>
                    <li><strong>Tickers avec N/A</strong> - Uniquement les tickers problématiques</li>
                    <li><strong>Par secteur</strong> - Un secteur spécifique</li>
                  </ul>
                </li>
                <li>Vérifiez le résumé des tickers sélectionnés</li>
                <li>Cliquez sur <strong>"Synchroniser (X)"</strong></li>
              </ol>
            </div>

            {/* Option 3 */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4 rounded-r">
              <h4 className="font-bold text-orange-900 mb-2">Option 3 : Synchronisation Individuelle</h4>
              <p className="text-orange-800 text-sm mb-3">
                Pour chaque ticker avec N/A :
              </p>
              <ol className="list-decimal list-inside space-y-2 text-orange-800 text-sm ml-2">
                <li>Sélectionnez le ticker dans la sidebar</li>
                <li>Cliquez sur <strong>"Synchroniser"</strong> (bouton avec icône de rafraîchissement)</li>
                <li>Confirmez si des modifications manuelles existent</li>
                <li>Attendez la fin de la synchronisation</li>
              </ol>
            </div>
          </section>

          {/* Processus Recommandé */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">🔄 Processus Recommandé</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>
                  <strong>Nettoyer les Fonds Mutuels (AUTOMATIQUE)</strong>
                  <p className="text-sm text-gray-600 ml-6 mt-1">✅ Déjà fait - Les fonds mutuels sont automatiquement supprimés au chargement</p>
                </li>
                <li>
                  <strong>Synchroniser Tous les Tickers</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 text-sm text-gray-600">
                    <li>Ouvrez Finance Pro 3p1</li>
                    <li>Sidebar → <strong>"Sync Tous les Tickers"</strong></li>
                    <li>Attendez la fin (peut prendre 5-15 minutes selon le nombre de tickers)</li>
                  </ul>
                </li>
                <li>
                  <strong>Vérifier les Résultats</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 text-sm text-gray-600">
                    <li>Allez dans l'onglet <strong>"KPI"</strong></li>
                    <li>Vérifiez le nombre de N/A restants</li>
                    <li>Les tickers avec N/A après sync sont probablement :
                      <ul className="list-circle list-inside ml-4 mt-1">
                        <li>Des fonds mutuels non détectés</li>
                        <li>Des tickers avec données vraiment invalides</li>
                        <li>Des tickers obsolètes</li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Synchroniser les N/A Restants (Optionnel)</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 text-sm text-gray-600">
                    <li>Cliquez sur <strong>"Afficher N/A"</strong> dans l'onglet KPI</li>
                    <li>Cliquez sur <strong>"Sync N/A (X)"</strong> pour synchroniser uniquement les tickers problématiques</li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          {/* Résultats Attendus */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📈 Résultats Attendus</h3>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
              <p className="text-green-800 text-sm mb-2">Après la synchronisation en masse :</p>
              <ul className="list-check list-inside space-y-1 text-green-800 text-sm ml-2">
                <li>✅ Tous les profils valides auront des données à jour</li>
                <li>✅ JPEGY calculable pour la plupart des tickers</li>
                <li>✅ Rendements projetés réalistes</li>
                <li>✅ Moins de N/A dans le dashboard</li>
              </ul>
            </div>
          </section>

          {/* Notes Importantes */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">⚠️ Notes Importantes</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r">
              <ul className="list-disc list-inside space-y-2 text-yellow-800 text-sm">
                <li><strong>Temps de traitement</strong> : La synchronisation en masse peut prendre plusieurs minutes</li>
                <li><strong>Sauvegarde automatique</strong> : Un snapshot est créé avant chaque sync</li>
                <li><strong>Préservation des données</strong> : Vos modifications manuelles sont préservées</li>
                <li><strong>Fonds mutuels</strong> : Sont automatiquement exclus (ne peuvent pas être analysés)</li>
              </ul>
            </div>
          </section>

          {/* Dépannage */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">🐛 Dépannage</h3>
            <div className="space-y-3">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                <h4 className="font-semibold text-red-900 mb-2">Si la synchronisation échoue pour certains tickers :</h4>
                <ul className="list-disc list-inside space-y-1 text-red-800 text-sm ml-2">
                  <li>Vérifiez la console pour les messages d'erreur</li>
                  <li>Certains tickers peuvent être obsolètes ou invalides</li>
                  <li>Utilisez le script de nettoyage pour les identifier</li>
                </ul>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                <h4 className="font-semibold text-blue-900 mb-2">Si trop de N/A persistent :</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm ml-2">
                  <li>Vérifiez que les tickers ne sont pas des fonds mutuels</li>
                  <li>Vérifiez que les données FMP sont disponibles</li>
                  <li>Certains tickers peuvent nécessiter une synchronisation manuelle</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

