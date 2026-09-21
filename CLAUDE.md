# Contexte projet — Pool d'heures Natacha

## Quoi

App web qui permet à Natacha de suivre ses heures supplémentaires dans un pool
cumulatif, depuis son téléphone (Samsung S25 FE). HTML/CSS/JS vanilla, sans
framework ni build. Conçue à l'origine comme Artifact Claude, puis portée pour
être hébergée sur GitHub Pages en autonomie complète (aucune dépendance aux
capacités runtime des Artifacts Claude — le téléchargement de sauvegarde utilise
l'API Blob/`<a download>` standard du navigateur).

Tout le code applicatif tient dans `index.html`. Les autres fichiers à la racine
existent uniquement pour rendre l'app **installable** sur Android, ce qu'un seul
fichier ne permet pas :

- `manifest.webmanifest` — sans lui, "Ajouter à l'écran d'accueil" ne crée qu'un
  marque-page qui s'ouvre dans le navigateur, barre d'adresse comprise.
- `sw.js` — Android exige un service worker avec gestionnaire `fetch` pour
  proposer une vraie installation. Stratégie **réseau d'abord**, cache en simple
  filet hors ligne : jamais de version figée.
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`.

Aucun build, aucune dépendance : ce sont des fichiers statiques servis tels quels.

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

`APP_VERSION` alimente aussi le service worker via `sw.js?v=…` : l'incrémenter
renouvelle le nom du cache et purge l'ancien à l'activation. C'est le mécanisme
qui garantit qu'une mise à jour atteint le téléphone de Natacha.

## Déploiement

Hébergé sur GitHub Pages, branche `main`, dossier racine, `Enforce HTTPS` actif.
URL : https://nvalettepro-sudo.github.io/Natacha_pointeuse/

**État au 21/09/2026** : version 1.2 en ligne, app installée et validée sur le
téléphone de Natacha (Samsung S25 FE).

### Le build Pages ne part pas toujours

Plusieurs pushes sur `main` n'ont déclenché **aucun** build : ni workflow
"pages build and deployment", ni déploiement, sans le moindre message d'erreur.
Le code était bien sur `main`, `has_pages` à `true` — seule l'étape de
publication restait muette.

Déblocage (à faire manuellement par Nico, c'est le seul levier qui a marché) :

1. https://github.com/nvalettepro-sudo/Natacha_pointeuse/settings/pages
2. **Branch** → `None` → **Save**
3. **Branch** → `main` + `/ (root)` → **Save**

Le build part dans la minute. **Ne jamais conclure qu'un déploiement est fait
sans l'avoir vérifié** : pousser ne suffit pas.

### Vérifier un déploiement depuis une session Claude

Trois choses sont bloquées et le resteront — inutile de les retenter :

| Action | Blocage |
|---|---|
| API `/repos/.../pages` (activer, lire la config) | 403 du proxy sortant |
| Charger `nvalettepro-sudo.github.io` (curl, WebFetch) | domaine bloqué |
| Relancer un workflow (API Actions) | 403 `Resource not accessible by integration` |

Ce qui marche, et qui sert de vérification de référence :

```
GET /repos/nvalettepro-sudo/Natacha_pointeuse/deployments?per_page=1&ref=main
GET /repos/nvalettepro-sudo/Natacha_pointeuse/deployments/<id>/statuses
GET /repos/nvalettepro-sudo/Natacha_pointeuse/actions/runs?per_page=1
```

Un déploiement est confirmé quand le `sha` correspond au commit poussé **et**
que l'état est `success`. Côté Natacha, le repère visuel équivalent est le
numéro de version en pied de page.

## Persistance

100% côté client (`localStorage`), pas de backend. Données propres à l'origine
(le domaine GitHub Pages) et au navigateur/appareil — pas de synchronisation
multi-appareils. Export/Import JSON en bas de page comme filet de sécurité.

## Prochaine étape : sauvegarde en écriture seule

**C'est la tâche en cours** depuis le 21/09/2026, la phase de déploiement et de
test par Natacha étant terminée. Les décisions ci-dessous sont actées avec
Nico (21/09/2026) — ne pas les remettre en question sans lui demander.

**Principe** : à chaque enregistrement / modification / suppression, l'app
envoie une **photo complète** de l'état vers un stockage en ligne. Jamais un
delta — toujours la totalité de `entries`. Chaque envoi est indépendant des
précédents ; la dernière ligne reçue fait foi.

**Transport** : un **Google Form caché relié à une Google Sheet**, sur le
**compte Google de Nico**. Pourquoi ce choix plutôt que l'API Google Drive :
Natacha n'a **pas de compte Google**. Drive imposerait un parcours OAuth côté
utilisateur, impossible ici. Un Form accepte un simple `POST` sans
authentification, ce qui préserve le "zéro backend, zéro dépendance" du
projet. Contrepartie : la requête part en `no-cors`, l'app ne peut donc
jamais savoir si Google a bien enregistré la ligne — seulement que la requête
est partie. Le premier envoi doit être vérifié à la main dans la Sheet.

**Format du payload : CSV** (séparateur `;`), pas JSON — même format que
l'export/import existant. Deux raisons : lisible tel quel par Nico dans la
Sheet, et 2,7× plus compact que le JSON (~71 car./entrée contre ~195), ce qui
repousse la limite de 50 000 car. par cellule Google Sheets d'environ 14 mois
à environ 3,2 ans (à ~18 mouvements/mois). Parser d'import **tolérant** :
accepte `;` ou `,` en séparateur, `.` ou `,` en décimale (pour survivre à un
export/réimport via Excel FR) — et continue d'accepter le JSON en entrée,
sans coût, en filet.

**Fréquence** : à chaque mutation, accrochée à `saveEntries()` (point unique
déjà emprunté par tous les chemins d'écriture — création, correction,
suppression, restauration). Pas de minuteur ni de regroupement.

**Hors ligne** : la saisie reste **toujours possible**, y compris sans
réseau (c'est tout l'intérêt du service worker). Si l'envoi échoue, la photo
est mise en file d'attente dans `localStorage` et renvoyée au retour du
réseau (`window.addEventListener("online", …)`) et à la réouverture de
l'app. Ne jamais bloquer la saisie pour forcer une sauvegarde — l'app locale
reste la source de vérité, la sauvegarde n'est qu'un filet.

**Pied de page** : date du dernier envoi *tenté* affichée en petit, sous le
numéro de version (ex. « Sauvegardé le 21/09 à 14h32 »). Pendant une file
d'attente hors ligne, remplacer par « Hors ligne — sauvegarde en attente ».
Ne jamais afficher "réussi" — le `no-cors` ne permet pas de le garantir,
seule la date de tentative est honnête.

**Restauration** : garder le bouton "Restaurer une sauvegarde" (fichier)
existant, et ajouter une option **"Coller une sauvegarde"** (zone de texte +
Confirmer) à côté. Pour un CSV copié depuis la Sheet et envoyé par message à
Natacha, coller est bien plus praticable sur téléphone qu'un fichier à faire
atterrir au bon endroit.

**Lisibilité côté Sheet** : le Form ne donne qu'une cellule brute par envoi
(un bloc CSV, pas un tableau). Prévoir un second onglet "Lecture" avec une
formule qui éclate la dernière ligne reçue en tableau (`SPLIT` sur retours
ligne puis sur `;`) — formule exacte à écrire une fois le Form créé.

**Limite de taille — pas encore un problème, ne pas coder préventivement** :
au rythme actuel, la cellule Sheets sature dans ~3,2 ans. Le jour venu, la
bonne réponse n'est **pas** de supprimer les entrées anciennes — le solde du
pool est la somme de `entries.heures`, en supprimer change silencieusement
le solde de Natacha. La bonne méthode est de **consolider** : remplacer les
entrées de plus d'un an par une entrée de report unique qui porte leur somme
(comme un solde à nouveau bancaire), jamais une suppression sèche.

**Reste à obtenir avant de coder** : l'URL d'envoi du Form
(`.../formResponse`) et l'identifiant du champ CSV (`entry.XXXXXXXXX`).

## Historique de conception

Développé itérativement via Claude.ai (Artifacts) avec Nico, non-développeur,
avant portage ici. Voir les commits / le README pour le détail des évolutions.
