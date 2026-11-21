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

- Horaire de base : lundi-jeudi 9h–18h30, vendredi 9h–17h30, avec une **pause
  déjeuner de base 12h30–14h** (journée de 8h, 7h le vendredi). Week-end : pas
  d'horaire de base ni de pause (Natacha ne travaille normalement pas, mais peut
  ponctuellement faire des heures — les deux sélecteurs proposent alors la plage
  1h–minuit).
- **Un seul formulaire depuis la v1.6** (l'onglet « Je prends des heures » a
  été supprimé, voir section *Formulaire unique*). Écart = temps travaillé
  réel − temps de base : arriver plus tôt, partir plus tard ou raccourcir la
  pause ajoute au pool ; arriver plus tard, partir plus tôt ou allonger la
  pause en retire. Une même journée peut combiner les deux (arrivée 10h +
  départ 22h = +2h30). « Absente » retire la journée entière (−8h, −7h le
  vendredi). Le pool peut devenir négatif.
- Le week-end, seules des heures en plus sont possibles (pas de base, donc
  rien à retirer).
- Une seule entrée par date : ressaisir une date existante met à jour
  l'entrée (upsert), ne duplique pas.
- Si rien n'est modifié par rapport à la base → **aucune entrée enregistrée**
  (pas de bruit à 0h dans l'historique).
- **Correction** : un clic sur une ligne du journal recharge l'entrée dans le
  formulaire (date + mode + horaires + note) et passe en mode correction —
  `editingId` mémorise l'entrée, la ligne est surlignée, le bouton devient
  "Corriger la journée" / "Corriger la prise". On sort du mode correction en
  changeant de date ou après enregistrement.
- **Retour à la base = suppression** : valider une journée dont le delta est nul
  alors qu'une entrée existe pour cette date propose de la supprimer
  (confirmation). Delta nul sans entrée existante → simple message, comme avant.
  Côté week-end, l'équivalent est de remettre les deux sélecteurs sur "Week-end".

## Modèle de données

Tableau `entries` sérialisé dans `localStorage` (clé `natacha_pool_heures_v1`).
Chaque entrée :
```
{ id, date (YYYY-MM-DD), type: "horaire"|"prise", heures (decimal signé, + ou -),
  arrivalMin, departureMin (minutes depuis 00:00), standardStart, standardEnd
  (base du jour, null si week-end), weekend (bool), note, createdAt,
  pauseStartMin, pauseEndMin, standardPauseStart, standardPauseEnd, absent }
```
Depuis la v1.6, toute nouvelle entrée est de type `horaire`. Le type
`prise` (ancien onglet) reste lu, affiché et compté tel quel. `absent: true`
= journée d'absence, avec `arrivalMin`/`departureMin` à `null`.
Les quatre champs de pause (v1.5) n'existent que sur les entrées « horaire » de
semaine. Une entrée qui ne les a pas (toutes celles d'avant la v1.5, les
prises, le week-end) a la pause de base. `heures` est stocké, jamais recalculé.
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

**État au 21/11/2026** : version 1.7 en ligne (cumul dans l'historique),
déploiement vérifié via l'API. App installée sur le téléphone de Natacha (Samsung S25 FE)
depuis la v1.2.

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
multi-appareils. Export/Import **CSV** (+ collage) en bas de page comme filet
manuel, et sauvegarde automatique en écriture seule vers Google Sheets (voir
section suivante) comme filet silencieux.

## Sauvegarde en écriture seule (Google Form → Google Sheet)

**Implémentée le 04/10/2026, version 1.3.** Décisions actées avec Nico
(21/09/2026) — ne pas les remettre en question sans lui demander.

**Principe** : à chaque enregistrement / correction / suppression — tout
chemin qui appelle `saveEntries()` — l'app envoie une **photo complète** de
`entries` vers un Google Form caché, relié à une Google Sheet sur le compte
de Nico. Jamais un delta. Chaque envoi est indépendant des précédents ; la
dernière ligne reçue dans la Sheet fait foi. C'est un filet, pas une
synchronisation : l'app tourne sur ses données locales au quotidien, Natacha
n'a besoin d'aucun compte Google.

**Identifiants du Form** (visibles de toute façon dans `index.html`, qui est
public sur GitHub Pages — aucune raison de les cacher ici) :
```
URL   : https://docs.google.com/forms/u/0/d/e/1FAIpQLSfPuYJcCBcD54k8HK3kMSQzL-j_qaDgn_jB6yWEY-w5qafMXQ/formResponse
Champ : entry.393463798
```
Envoyé en `POST`, `mode:"no-cors"`, corps `URLSearchParams` (un seul champ).
Les champs internes que Google ajoute lui-même en remplissant le formulaire à
la main (`fvv`, `partialResponse`, `fbzx`…) ne sont **pas nécessaires** — un
`POST` ne contenant que `entry.393463798` suffit, vérifié en pratique.

**Pourquoi un Form plutôt que l'API Google Drive** : Natacha n'a pas de
compte Google, donc pas d'OAuth possible côté utilisateur. Un Form accepte
un `POST` sans authentification. Contrepartie : la requête part en
`no-cors` — l'app sait qu'elle est partie (le `fetch` peut rejeter, ce qui
sert à détecter le hors ligne), jamais si Google l'a vraiment enregistrée.
Le premier envoi a été vérifié à la main dans la Sheet (deux lignes `TEST123`
reçues) ; pas besoin de revérifier après un changement de code côté app, sauf
si l'URL ou le champ changent.

**Format du payload : CSV** (`;`), fonctions `entriesToCSV()` /
`entriesFromCSV()` dans `index.html`. Même format que l'export/import — pas
un format à part. Deux raisons : lisible tel quel par Nico dans la Sheet, et
plus compact que le JSON. **Taille réelle mesurée le 16/11/2026** (les
estimations antérieures, ~71 car./entrée et ~3,2 ans, reposaient sur un
identifiant court et étaient fausses) : ~127 car./entrée en v1.6 (UUID de 36
car. + date ISO de 24 car. + 4 colonnes de pause), soit ~395 entrées par
cellule de 50 000 car. — **~5 ans au rythme réel de Natacha** (~6,5
mouvements/mois sur ses deux premiers mois), ~1,8 an à 18/mois. Leviers
simples si un jour c'est serré : retirer `standardPauseStart/End` (toujours
12h30/14h), raccourcir les identifiants.

**Import tolérant** (`parseBackupText()`) : accepte `;` ou `,` en séparateur
(détecté sur la ligne d'en-tête), `.` ou `,` en décimale, les dates en
`YYYY-MM-DD` ou `JJ/MM/AAAA` (survit à un export/réimport via Excel FR) — et
continue d'accepter le JSON brut en entrée (anciennes sauvegardes), sans
coût, en filet. Chemin commun à la restauration par fichier et par texte
collé : `applyBackupText()`.

**Hors ligne** : la saisie reste **toujours possible**. Si `sendBackup()`
échoue (le `fetch` rejette), un flag `natacha_pool_backup_pending_v1` est
posé dans `localStorage` et renvoyé sur l'évènement `online` ainsi qu'au
rechargement de l'app. Ne bloque jamais la saisie — l'app locale reste la
source de vérité.

**Pied de page** (`#backupStatus`, sous le numéro de version) : date du
dernier envoi *tenté*, jamais "réussi" — le `no-cors` ne permet pas de le
garantir. « Hors ligne — sauvegarde en attente » pendant la file d'attente.

**Restauration** : "Restaurer une sauvegarde" (fichier, accepte `.csv` et
`.json`) et "Coller une sauvegarde" (zone de texte) font toutes deux appel à
`applyBackupText()`. Coller est pensé pour un CSV copié depuis la Sheet et
envoyé par message à Natacha — pas de fichier à faire atterrir au bon
endroit sur son téléphone.

**Reste à faire, pas encore un problème** : second onglet "Lecture" dans la
Sheet avec une formule `SPLIT` qui éclate la dernière ligne reçue en tableau
(le Form ne donne qu'un bloc CSV brut par cellule) — formule à écrire à la
demande, elle dépend de la colonne réelle dans la Sheet de Nico. Et au bout
de ~5 ans au rythme actuel : la cellule Sheets sature. Le jour venu, **ne jamais supprimer**
les entrées anciennes (le solde est la somme de `entries.heures`, en
supprimer le change silencieusement) — **consolider** : une entrée de report
unique qui porte leur somme, comme un solde à nouveau bancaire.

**Vérifié en usage réel le 15/11/2026** : 9 lignes reçues depuis la mise en
place (hors `TEST123`), la dernière le 10/11/2026, avec 13 mouvements réels
de Natacha dedans (dates du 12/09 au 10/11, notes comme "Lits Libourne"). La
sauvegarde fonctionne en production, pas seulement en test. **Revérifié le
21/11/2026** : 15 lignes, dont 6 envoyées par les v1.5/1.6 (format à 16
colonnes, pause comprise), dernière le 20/11 à 16:11 avec 16 mouvements, solde
38 h. Natacha corrige ses journées (le 20/11 a été réenregistré 4 fois).

## Pause déjeuner (v1.5, 16/11/2026)

Spécifiée avec Nico sur deux maquettes le 15/11, codée le 16/11.

**Formulaire « Mes horaires », en semaine** : grille `#timeGrid` à quatre
sélecteurs — Arrivée · Début pause / séparateur « pause déjeuner » / Fin
pause · Départ. Champ Base : `9h–12h30 · 14h–18h30` (`17h30` le vendredi).
Le week-end, la classe `no-pause` masque les deux champs de pause et Arrivée
· Départ reviennent sur une seule ligne.

**Sélecteurs** (pas de 30 min, `populatePauseStart` / `populatePauseEnd`) :
- Début : « Base (12h30) » puis 9h30 → 18h (17h le vendredi).
- Fin : « Base (14h) » (seulement si elle tombe après le début), puis
  **« Pas de pause »** (fin = début), puis début + 30 min → 18h (17h le
  vendredi). Liste reconstruite à chaque changement du début : une fin avant
  le début est impossible.
- Changer le début **déplace la pause en gardant sa durée** : décaler sa
  pause se fait en un geste, sans effet sur le pool. On ajuste ensuite la fin.

**Calcul** (`weekdayHoraireDelta`) : écart arrivée/départ + (1h30 − durée
réelle de la pause). Seule la durée compte : 15h–16h30 = 0, 15h–16h = +30
min, 13h–16h = −1h30, pas de pause = +1h30.

**Affichage** :
- Aperçu vert si positif, orange si négatif, avec une ligne de détail
  (« pause de 3 h au lieu de 1 h 30 ») quand la durée de la pause diffère.
- Chaque champ qui s'écarte de la base est coloré selon **son propre effet**
  (`markEffect`) : vert s'il ajoute du temps travaillé, orange s'il en
  retire. Pause décalée à 15h–16h : début vert (+2h30 travaillées), fin
  orange (−2h), net +30 min. S'applique aussi aux deux champs de « Je prends
  des heures ».
- Journal : couleur et signe suivent le signe de `heures`, plus le type.
  Description « Pause 13h → 16h » ou « Pas de pause » seulement si la pause
  s'écarte de la base.
- Vues Semaine / Mois : **écart net par jour, prises comprises** — la somme
  des totaux égale le solde.

**Données** : voir *Modèle de données*. CSV : quatre colonnes en fin de
ligne ; l'import lit par nom de colonne, les sauvegardes v1.4 restent
restaurables et ne reçoivent aucune pause inventée.

**Vérifié avant mise en ligne** sur les 13 vraies entrées de Natacha (dernière
ligne de la Sheet au 10/11) : solde +37 h, stockage relu octet pour octet
identique, aucun envoi au chargement, totaux Semaine et Mois = 37 h,
correction d'une ancienne journée → pause chargée à la base et écart
inchangé, ancienne sauvegarde CSV restaurée sans pause inventée.

Depuis la v1.6, la pause fait partie du formulaire unique décrit ci-dessous.

## Formulaire unique (v1.6, 16/11/2026)

Spécifié avec Nico sur la maquette v3, codé le 16/11. L'onglet « Je prends
des heures » disparaît ; tout passe par un seul formulaire.

**Calcul** (`weekdayDelta`, `workedMin`, `baseWorkedMin`) : écart = temps
travaillé réel − temps de base (8h, 7h le vendredi). Temps travaillé =
(départ − arrivée) − pause, où la pause est :
- la pause choisie, si Natacha est présente pendant toute la pause de base
  (arrivée ≤ 12h30 et départ ≥ 14h) — `pauseApplicable` ;
- sinon (demi-journée), la partie de la pause de base comprise dans sa
  présence (`overlapMin`). Les champs de pause sont alors grisés (« — »).
  Arrivée 14h = −3h30, départ 12h30 = −4h30, départ 13h30 = −4h30, arrivée
  13h = −3h30 (la pause de base n'est jamais comptée comme du travail).

Quand la pause est réglable et que l'arrivée et le départ sont à la base, on
retombe exactement sur la v1.5 (vérifié : 12 des 13 journées réelles de
Natacha donnent la même valeur ; seule sa prise du 01/10 changerait, voir
plus bas).

**Sélecteurs** :
- Arrivée : « Absente », puis 1h → 23h30 en ordre chronologique, « Base (9h) »
  présélectionnée.
- Départ : de l'arrivée + 30 min à minuit, « Base (18h30) » présélectionnée.
  Changer l'arrivée garde le départ et la pause s'ils restent possibles.
- Pause : comme en v1.5, bornée en plus par la présence (au plus tôt à
  l'arrivée, au plus tard au départ ou à 30 min avant la fin de base).
- « Absente » grise le départ et la pause.

**Affichage** : couleur de chaque champ selon son propre effet (arrivée
tardive orange, départ tardif vert…). Ligne de détail : « travaillé 10 h 30
au lieu de 8 h » ; si seule la pause s'écarte de la base, formulation v1.5
conservée (« pause de 3 h au lieu de 1 h 30 ») ; « journée non travaillée »
pour une absence.

**Anciennes saisies — jamais modifiées d'office** (consigne de Nico) : les
entrées `prise` restent comptées à leur valeur. Ouvrir une journée la charge
dans le formulaire unique sans rien changer. La réenregistrer la recalcule
avec la règle actuelle ; si sa valeur change, ou si la date portait deux
entrées (ancien horaire + ancienne prise, fusionnées en une), un
**avertissement** s'affiche avant (choix B de Nico) : « Cette journée avait
été comptée −5 h selon l'ancienne règle. Elle sera enregistrée à −4 h 30.
Continuer ? ». Seule journée concernée chez Natacha au 16/11 : le 01/10
(départ 13h30, −5h sous l'ancienne règle, −4h30 sous la nouvelle).

**Vérifié avant mise en ligne** sur ses 13 vraies entrées : solde +37 h,
stockage identique octet pour octet, aucun envoi au chargement, totaux
Semaine et Mois = 37 h, 12 journées identiques sous la nouvelle règle,
avertissement exact sur le 01/10 (Annuler = rien ne change ; Continuer =
−4h30, solde 37h30), ancienne sauvegarde v1.4 restaurée telle quelle.

## Cumul dans l'historique (v1.7, 21/11/2026)

Demandé par Nico, maquetté puis validé le 21/11. Chaque ligne du journal
affiche, à droite de la date, le solde juste avant et juste après le
mouvement (« 30 h → 32 h 30 »). Les vues Semaine et Mois ont une ligne
« Solde » sous le total (solde au début → à la fin de la période).

- **Jamais stocké** : `runningBalances()` recalcule à chaque affichage, dans
  l'ordre chronologique des journées (puis de saisie pour une même date),
  en partant de 0 h. Corriger une journée passée, ou en saisir une ancienne,
  met donc à jour toutes les journées suivantes sans rien faire d'autre.
- Le « après » de la ligne la plus récente égale toujours le solde affiché
  en haut : contrôle visuel.
- Purement de l'affichage : modèle de données, sauvegarde et CSV inchangés.
- Corrige au passage un défaut d'affichage antérieur : les montants des vues
  Semaine/Mois s'affichaient « +5 H 30 » (le `text-transform:capitalize` des
  noms de jour s'appliquait aussi au montant).

**Vérifié avant mise en ligne** sur ses 16 vraies entrées (dernière ligne de
la Sheet, 20/11/2026 16:11) : solde 38 h, stockage identique octet pour
octet, aucun envoi au chargement, cumuls enchaînés (chaque « avant » = le
« après » précédent, « après − avant » = montant), soldes hebdo et mensuels
enchaînés jusqu'à 38 h, correction d'une journée passée répercutée sur les
suivantes, journée ancienne insérée à sa date.

## Mettre à jour l'app sans risquer les données de Natacha

Les heures de Natacha vivent dans le `localStorage` de son téléphone — une
mémoire de navigateur totalement séparée de ce que GitHub Pages sert. Pousser
du code sur `main` ne touche **jamais** `localStorage`, y compris via le
service worker : son cache ne gère que les fichiers de l'app, jamais le
stockage des données.

**Les deux seules choses qui peuvent vraiment casser ses données :**
- Changer `STORAGE_KEY` (`natacha_pool_heures_v1`) — l'app lirait une
  mémoire vide, ses données resteraient présentes mais invisibles.
- Changer le modèle d'une entrée (champ renommé, type changé) sans
  rétrocompatibilité — `isValidEntry()` rejetterait silencieusement ses
  entrées existantes au prochain chargement.

Tout le reste (UI, règles métier, nouveaux boutons) ne peut pas toucher à
ses données, même en cas de bug — au pire l'affichage casse, ses heures en
`localStorage` restent intactes.

**Processus à suivre pour chaque changement** (celui déjà appliqué à chaque
évolution de ce projet) :
1. Développer sur une branche, jamais directement sur `main`.
2. Tester en Playwright (suite de non-régression : création, correction,
   suppression, week-end, hors ligne, export/import) avant de pousser —
   jamais tester directement sur le téléphone de Natacha. **Rejouer aussi ses
   vraies données** : dernière ligne de la Sheet, chargée dans
   `localStorage` sous la forme exacte stockée par le téléphone, puis
   vérifier solde, stockage inchangé et absence d'envoi au chargement.
3. Incrémenter `APP_VERSION`.
4. Pousser, puis vérifier le déploiement via l'API GitHub (voir section
   *Déploiement*) avant de considérer que c'est en ligne.

**Règle absolue, jamais d'exception** : si un rafraîchissement forcé est un
jour nécessaire côté Natacha, ne jamais lui demander d'« effacer les données
de navigation » ou « cookies et données de site » — ça viderait son
`localStorage` avec le cache, donc ses heures. Seule demande légitime :
« vider les images et fichiers en cache », qui laisse `localStorage` intact.
`APP_VERSION` + rechargement suffit dans l'immense majorité des cas.

### Tester sans polluer sa sauvegarde partagée

Le Form/la Sheet sont une destination **unique et partagée** — pas propre à
chaque appareil, contrairement à `localStorage`. Si Nico ouvre l'URL de
production sur son PC pour tester un changement et enregistre des
mouvements, l'app enverrait une photo de *ces données de test* vers la même
Sheet que celle de Natacha — la dernière ligne reçue (censée faire foi,
voir plus haut) serait alors ses données de test, pas le vrai solde de
Natacha. Ses données à elle, sur son téléphone, ne risqueraient toujours
rien (`localStorage` reste séparé) — seule l'intégrité de la sauvegarde
serait compromise.

**Paramètre `?nobackup`** (`TEST_MODE` dans `index.html`) : ouvrir
`https://nvalettepro-sudo.github.io/Natacha_pointeuse/?nobackup` coupe
uniquement l'appel réseau vers le Form — `sendBackup()` retourne
immédiatement sans rien envoyer. Le pied de page affiche alors « Mode test
— sauvegarde désactivée » à la place de la date, pour qu'il soit impossible
d'oublier qu'on est en mode test. Tout le reste (saisie, correction,
suppression, export/import, `localStorage`) fonctionne normalement — seul
l'envoi vers Google est coupé.

Point à garder en tête : ce paramètre ne touche QUE l'envoi vers le Form,
pas `localStorage` — si le même navigateur contient déjà des données
(improbable sur le PC de Nico, qui n'est jamais celui de Natacha), elles
restent visibles avec ou sans `?nobackup`, puisque c'est la même origine.

## Historique de conception

Développé itérativement via Claude.ai (Artifacts) avec Nico, non-développeur,
avant portage ici. Voir les commits / le README pour le détail des évolutions.
