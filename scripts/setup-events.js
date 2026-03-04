const fs = require('fs');
const path = require('path');

// Utiliser ts-node pour exécuter le code TypeScript
const { exec } = require('child_process');

async function setupEvents() {
  try {
    console.log('🚀 Début de la configuration des événements...');
    
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'setup-events-simple.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Fichier SQL lu:', sqlFile);
    console.log('📋 Contenu SQL:');
    console.log(sqlContent);
    
    // Exécuter le SQL via ts-node
    const script = `
      const { query } = require('../src/config/database');
      
      const sql = \`${sqlContent.replace(/`/g, '\\`')}\`;
      
      query(sql).then(result => {
        console.log('✅ Événements configurés avec succès!');
        console.log('📊 Résultat:', result);
        
        // Vérifier les événements créés
        return query('SELECT * FROM evenement ORDER BY phase_order ASC');
      }).then(verifyResult => {
        console.log('📋 Événements créés:');
        verifyResult.rows.forEach((event, index) => {
          console.log(\`  \${index + 1}. \${event.name} (\${event.status}) - Phase \${event.phase_order}\`);
        });
        process.exit(0);
      }).catch(error => {
        console.error('❌ Erreur lors de la configuration des événements:', error);
        process.exit(1);
      });
    `;
    
    // Écrire le script temporaire
    const tempScript = path.join(__dirname, 'temp-setup.js');
    fs.writeFileSync(tempScript, script);
    
    // Exécuter avec ts-node
    exec(`npx ts-node ${tempScript}`, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur:', error);
        console.error('stderr:', stderr);
        return;
      }
      console.log(stdout);
      
      // Nettoyer le fichier temporaire
      fs.unlinkSync(tempScript);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des événements:', error);
    process.exit(1);
  }
}

// Exécuter le script
setupEvents();
