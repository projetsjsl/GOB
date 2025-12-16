/**
 * Script de test pour l'API de gestion des redirections
 * Teste toutes les opérations CRUD
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testRedirectsAPI() {
    console.log('🧪 Test de l\'API /api/admin/redirects\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 1: GET - Récupérer toutes les redirections
    console.log('📋 Test 1: GET - Récupérer toutes les redirections');
    try {
        const getResponse = await fetch(`${API_BASE_URL}/api/admin/redirects`);
        const getData = await getResponse.json();
        
        if (getResponse.ok) {
            console.log('✅ GET réussi');
            console.log(`   Nombre de redirections: ${getData.count}`);
            console.log(`   Redirections:`, JSON.stringify(getData.redirects, null, 2));
        } else {
            console.log('❌ GET échoué');
            console.log(`   Erreur: ${getData.error || getData.message}`);
        }
    } catch (error) {
        console.log('❌ GET erreur:', error.message);
    }
    console.log('');

    // Test 2: POST - Créer une nouvelle redirection (test)
    console.log('➕ Test 2: POST - Créer une nouvelle redirection');
    const testRedirect = {
        source: '/test-redirect-api',
        destination: 'https://example.com',
        permanent: false
    };
    
    try {
        const postResponse = await fetch(`${API_BASE_URL}/api/admin/redirects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testRedirect)
        });
        const postData = await postResponse.json();
        
        if (postResponse.ok) {
            console.log('✅ POST réussi');
            console.log(`   Redirection créée: ${postData.redirect.source} → ${postData.redirect.destination}`);
            console.log(`   Commit SHA: ${postData.commit}`);
        } else {
            console.log('❌ POST échoué');
            console.log(`   Erreur: ${postData.error || postData.message}`);
            if (postData.error && postData.error.includes('existe déjà')) {
                console.log('   ℹ️  La redirection existe déjà (normal si déjà testée)');
            }
        }
    } catch (error) {
        console.log('❌ POST erreur:', error.message);
    }
    console.log('');

    // Test 3: PUT - Modifier la redirection de test
    console.log('✏️  Test 3: PUT - Modifier la redirection');
    try {
        const putResponse = await fetch(`${API_BASE_URL}/api/admin/redirects`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: '/test-redirect-api',
                destination: 'https://example.com/modified',
                permanent: true
            })
        });
        const putData = await putResponse.json();
        
        if (putResponse.ok) {
            console.log('✅ PUT réussi');
            console.log(`   Redirection modifiée: ${putData.redirect.source} → ${putData.redirect.destination}`);
            console.log(`   Type: ${putData.redirect.permanent ? '301 (Permanent)' : '302 (Temporaire)'}`);
        } else {
            console.log('❌ PUT échoué');
            console.log(`   Erreur: ${putData.error || putData.message}`);
        }
    } catch (error) {
        console.log('❌ PUT erreur:', error.message);
    }
    console.log('');

    // Test 4: DELETE - Supprimer la redirection de test
    console.log('🗑️  Test 4: DELETE - Supprimer la redirection de test');
    try {
        const deleteResponse = await fetch(`${API_BASE_URL}/api/admin/redirects`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: '/test-redirect-api' })
        });
        const deleteData = await deleteResponse.json();
        
        if (deleteResponse.ok) {
            console.log('✅ DELETE réussi');
            console.log(`   Redirection supprimée: ${deleteData.redirect.source}`);
            console.log(`   Commit SHA: ${deleteData.commit}`);
        } else {
            console.log('❌ DELETE échoué');
            console.log(`   Erreur: ${deleteData.error || deleteData.message}`);
        }
    } catch (error) {
        console.log('❌ DELETE erreur:', error.message);
    }
    console.log('');

    // Test 5: Validation - Source sans /
    console.log('🔍 Test 5: Validation - Source sans /');
    try {
        const invalidResponse = await fetch(`${API_BASE_URL}/api/admin/redirects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: 'invalid-source',
                destination: 'https://example.com'
            })
        });
        const invalidData = await invalidResponse.json();
        
        if (!invalidResponse.ok && invalidData.error) {
            console.log('✅ Validation fonctionne (erreur attendue)');
            console.log(`   Message: ${invalidData.error}`);
        } else {
            console.log('❌ Validation échouée (devrait rejeter)');
        }
    } catch (error) {
        console.log('❌ Validation erreur:', error.message);
    }
    console.log('');

    // Test 6: GET final - Vérifier l'état final
    console.log('📋 Test 6: GET final - Vérifier l\'état final');
    try {
        const finalResponse = await fetch(`${API_BASE_URL}/api/admin/redirects`);
        const finalData = await finalResponse.json();
        
        if (finalResponse.ok) {
            console.log('✅ GET final réussi');
            console.log(`   Nombre de redirections: ${finalData.count}`);
            console.log(`   Redirections actuelles:`, finalData.redirects.map(r => r.source).join(', ') || 'Aucune');
        } else {
            console.log('❌ GET final échoué');
        }
    } catch (error) {
        console.log('❌ GET final erreur:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Tests terminés\n');
}

// Exécuter les tests
if (require.main === module) {
    testRedirectsAPI().catch(console.error);
}

module.exports = { testRedirectsAPI };











