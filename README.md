# Pool d'heures · Natacha

Application web mono-fichier (zéro dépendance, zéro backend) pour suivre les heures
supplémentaires de Natacha dans un pool cumulatif.

## Fonctionnement

- **Mes horaires** : Natacha choisit une date, puis ajuste son heure d'arrivée (plus tôt)
  et/ou de départ (plus tard) par rapport à son horaire de base. L'écart est ajouté au pool.
- **Je prends des heures** : même principe inversé — arriver plus tard et/ou partir plus tôt
  déduit du pool. Le pool peut devenir négatif.
- **Horaires de base** : 9h–18h30 du lundi au jeudi, 9h–17h30 le vendredi. Le week-end,
  les horaires sont libres (aucun horaire de base).
- **Historique** : consultable en journal, par semaine (ISO) ou par mois, avec suppression
  possible d'une entrée erronée.
- **Correction** : toucher une journée du journal la recharge dans le formulaire, telle
  qu'elle a été saisie. Natacha ajuste les horaires et revalide — le bouton indique
  "Corriger la journée" et la ligne concernée reste surlignée.
- Une seule entrée par date et par type (ajout/prise) : ressaisir une date déjà utilisée
  met à jour l'entrée existante plutôt que d'en créer une nouvelle.
- Aucune entrée n'est enregistrée si rien n'est modifié par rapport à l'horaire de base
  (pas de "0h" dans l'historique). Si une correction ramène une journée à ses horaires de
  base, l'entrée est retirée de l'historique après confirmation.

## Conservation des données

**Tout est stocké en local, dans le navigateur de l'appareil qui ouvre la page**
(`localStorage`, propre à l'origine `https://<utilisateur>.github.io/<repo>/`) :

- Pas de serveur, pas de base de données : GitHub Pages héberge uniquement le fichier statique.
- Les données restent sur l'appareil de Natacha tant qu'elle rouvre le **même lien** dans le
  **même navigateur**. Un changement de téléphone, de navigateur, ou un vidage du cache/des
  données du site efface l'historique local.
- Pour limiter ce risque : ajouter la page à l'écran d'accueil (évite le nettoyage automatique
  des données par le navigateur) et exporter une sauvegarde JSON de temps en temps via le
  bouton "Exporter une sauvegarde" (bas de page). "Restaurer une sauvegarde" recharge un
  fichier exporté.
- Les données ne sont **pas synchronisées** entre plusieurs appareils.

## Déploiement (GitHub Pages)

1. `index.html` doit rester à la racine du dépôt (ou dans `/docs`, à ajuster dans les
   paramètres Pages du dépôt en conséquence).
2. Dans les paramètres du dépôt GitHub → *Pages* → *Source* : brancher sur la branche
   principale, dossier `/ (root)`.
3. L'application est ensuite accessible à `https://<utilisateur>.github.io/<repo>/`.

## Structure

- `index.html` — application complète (HTML + CSS + JS), aucune autre dépendance.
- Pas de build, pas de `package.json` : ouvrir le fichier directement ou le servir tel quel.
