# Contexte projet — Pool d'heures Natacha

## Quoi

App web mono-fichier (`index.html` — HTML/CSS/JS vanilla, sans framework ni build)
qui permet à Natacha de suivre ses heures supplémentaires dans un pool cumulatif,
depuis son téléphone (Samsung S25 FE). Conçue à l'origine comme Artifact Claude,
puis portée pour être hébergée sur GitHub Pages en autonomie complète (aucune
dépendance aux capacités runtime des Artifacts Claude — le téléchargement de
sauvegarde utilise l'API Blob/`<a download>` standard du navigateur).

## Règles métier

- Horaire de base : lundi-jeudi 9h–18h30, vendredi 9h–17h30. Week-end : pas
  d'horaire de base (Natacha ne travaille normalement pas, mais peut ponctuellement
  faire des heures — les deux sélecteurs proposent alors la plage 1h–minuit).
- **Mes horaires** (ajoute au pool) : arrivée avant la base (jusqu'à 1h du matin)
  et/ou départ après la base (jusqu'à minuit) → gain ajouté au pool.
- **Je prends des heures** (retire du pool) : arrivée après la base et/ou départ
  avant la base (bornes symétriques à l'intérieur de la journée de base) → perte
  déduite du pool. Le pool peut devenir négatif.
- Le week-end, "Je prends des heures" est totalement bloqué (Natacha ne peut pas
  prendre d'heures un jour où elle n'a pas d'horaire de base).
- Une seule entrée par (date, type) : ressaisir une date existante met à jour
  l'entrée (upsert), ne duplique pas.
- Si rien n'est modifié par rapport à la base → **aucune entrée enregistrée**
  (pas de bruit à 0h dans l'historique).
- **Correction** : un clic sur une ligne du journal recharge l'entrée dans le
  formulaire (date + mode + horaires + note) et passe en mode correction —
  `editingId` mémorise l'entrée, la ligne est surlignée, le bouton devient
  "Corriger la journée" / "Corriger la prise". On sort du mode correction en
  changeant de date, en basculant de mode, ou après enregistrement.
- **Retour à la base = suppression** : valider une journée dont le delta est nul
  alors qu'une entrée existe pour ce (date, type) propose de la supprimer
  (confirmation). Delta nul sans entrée existante → simple message, comme avant.
  Côté week-end, l'équivalent est de remettre les deux sélecteurs sur "Week-end".

## Modèle de données

Tableau `entries` sérialisé dans `localStorage` (clé `natacha_pool_heures_v1`).
Chaque entrée :
```
{ id, date (YYYY-MM-DD), type: "horaire"|"prise", heures (decimal signé, + ou -),
  arrivalMin, departureMin (minutes depuis 00:00), standardStart, standardEnd
  (base du jour, null si week-end), weekend (bool), note, createdAt }
```
Solde du pool = somme de `heures` sur toutes les entrées.

## Contraintes UI

- Français uniquement. Design "zen" (palette sauge/crème, police Fraunces/Karla
  via Google Fonts, aucune autre dépendance externe).
- Contrainte forte : en-tête + solde + formulaire (jusqu'au bouton "Enregistrer
  la journée") doivent tenir sur l'écran d'un Samsung S25 FE **sans scroller** —
  seul l'historique (bas de page) est scrollable. Toute évolution du formulaire
  doit repartir de cette contrainte (mesurer/estimer la hauteur avant d'ajouter
  des éléments visibles par défaut).

## Numéro de version

Affiché en pied de page, piloté par la constante `APP_VERSION` en tête du
script (seul endroit à modifier). Sert à vérifier d'un coup d'œil que le
téléphone de Natacha ne sert pas une version en cache. **À incrémenter à
chaque changement fonctionnel déployé.**

## Persistance

100% côté client (`localStorage`), pas de backend. Données propres à l'origine
(le domaine GitHub Pages) et au navigateur/appareil — pas de synchronisation
multi-appareils. Export/Import JSON en bas de page comme filet de sécurité.

## Prochaine étape prévue (pas encore demandée)

Nico veut ajouter une **sauvegarde en écriture seule** : à chaque enregistrement/
modification/suppression, l'app envoie une copie de l'état complet vers un
stockage en ligne (probablement un Google Form caché relié à une Google Sheet,
sur le compte Google de Nico — pas celui de Natacha, qui n'a pas de compte
Google/Claude). Ce n'est PAS une synchronisation multi-appareils temps réel :
l'app continue de fonctionner sur ses données locales au quotidien, cette
sauvegarde sert uniquement de filet en cas de réinitialisation du navigateur
de Natacha. Ne pas implémenter cette partie tant que Nico ne le demande pas
explicitement — priorité actuelle : déployer et faire tester l'app par Natacha.

## Historique de conception

Développé itérativement via Claude.ai (Artifacts) avec Nico, non-développeur,
avant portage ici. Voir les commits / le README pour le détail des évolutions.
