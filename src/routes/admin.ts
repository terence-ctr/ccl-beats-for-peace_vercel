import { Router } from 'express';
import { OrganizerController } from '../controllers/organizerController';
import { requireOrganizerRole } from '../middleware/organizerAuth';

const router = Router();

// Middleware pour vérifier le rôle d'organisateur
router.use(requireOrganizerRole);

// Mettre à jour la validation d'un candidat
router.put('/candidates/:id/validation', OrganizerController.updateCandidateValidation);

// Obtenir tous les candidats avec leur statut de validation
router.get('/candidates', OrganizerController.getCandidatesWithValidation);

// Obtenir les statistiques des validations
router.get('/validation-stats', OrganizerController.getValidationStats);

export default router;
