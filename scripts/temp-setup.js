
      const { query } = require('../src/config/database');
      
      const sql = `-- Script simple pour créer les événements un par un

-- Événement 1: Inscriptions
INSERT INTO \`evenement\` 
(\`name\`, \`description\`, \`phase_order\`, \`status\`, \`start_date\`, \`end_date\`, \`hashtag\`, \`vote_actif\`, \`sound_url\`, \`audio_rap_url\`, \`created_at\`) 
VALUES 
('Inscriptions', 'Phase d\'inscription et de soumission des candidatures', 1, 'active', '2026-02-27 23:00:00', '2026-03-07 23:00:00', '#FESTIRASInscription', 1, 'http://localhost:3001/uploads/audio/ccl_beats_instrumental.mp3', NULL, NOW());

-- Événement 2: Éliminatoires
INSERT INTO \`evenement\` 
(\`name\`, \`description\`, \`phase_order\`, \`status\`, \`hashtag\`, \`vote_actif\`, \`created_at\`) 
VALUES 
('Éliminatoires', 'Phase de sélection et votes du public', 2, 'terminee', '#FESTIRASEliminatoires', 0, NOW());

-- Événement 3: Grande Finale
INSERT INTO \`evenement\` 
(\`name\`, \`description\`, \`phase_order\`, \`status\`, \`hashtag\`, \`vote_actif\`, \`created_at\`) 
VALUES 
('Grande Finale', 'Finale nationale avec jury et public', 3, 'future', '#FESTIRASFinale', 0, NOW());
`;
      
      query(sql).then(result => {
        console.log('✅ Événements configurés avec succès!');
        console.log('📊 Résultat:', result);
        
        // Vérifier les événements créés
        return query('SELECT * FROM evenement ORDER BY phase_order ASC');
      }).then(verifyResult => {
        console.log('📋 Événements créés:');
        verifyResult.rows.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.name} (${event.status}) - Phase ${event.phase_order}`);
        });
        process.exit(0);
      }).catch(error => {
        console.error('❌ Erreur lors de la configuration des événements:', error);
        process.exit(1);
      });
    