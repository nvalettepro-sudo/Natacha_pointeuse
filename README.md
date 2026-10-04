# Pool d'heures · Natacha

**→ https://nvalettepro-sudo.github.io/Natacha_pointeuse/**

Application web (zéro dépendance, zéro backend) pour suivre les heures
supplémentaires de Natacha dans un pool cumulatif. Tout le code applicatif tient
dans `index.html` ; les autres fichiers servent uniquement à rendre l'app
installable sur Android et utilisable hors ligne.

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

## Installation sur le téléphone

L'app est installable : depuis le lien, le menu du navigateur propose
"Installer l'application" (Chrome / Samsung Internet) ou "Sur l'écran d'accueil"
(Safari). Elle s'ouvre alors en plein écran, sans barre d'adresse, et fonctionne
sans réseau.

Si le navigateur ne propose qu'un simple raccourci, c'est qu'il sert une version
en cache : forcer le rechargement de la page, puis réessayer.

## Conservation des données

**Tout est stocké en local, dans le navigateur de l'appareil qui ouvre la page**
(`localStorage`, propre à l'origine `https://<utilisateur>.github.io/<repo>/`) :

- Pas de serveur, pas de base de données : GitHub Pages héberge uniquement le fichier statique.
- Les données restent sur l'appareil de Natacha tant qu'elle rouvre le **même lien** dans le
  **même navigateur**. Un changement de téléphone, de navigateur, ou un vidage du cache/des
  données du site efface l'historique local.
- Les données ne sont **pas synchronisées** entre plusieurs appareils.

## Sauvegarde automatique (Google Sheets)

En plus du `localStorage`, l'app tient un filet silencieux : à chaque mouvement
enregistré, corrigé ou supprimé, elle envoie une copie complète des données vers
une Google Sheet sur le compte personnel de Nico. Ce n'est **pas** une
synchronisation — l'app continue de fonctionner au quotidien sur ses données
locales, dans le navigateur de Natacha, qui n'a besoin d'aucun compte Google. La
sauvegarde ne sert qu'à restaurer les données si son téléphone ou son navigateur
venait à perdre le `localStorage`.

**Accès** (comptes Google de Nico uniquement — ces liens ne s'ouvriront pas pour
quelqu'un d'autre, la Sheet et le dossier sont privés) :

- 📁 [Dossier "Sauvegarde Natacha Pointeuse"](https://drive.google.com/drive/folders/1btVk2dDRUkYtH7XH2sC3EowOGCVnPbvJ) — regroupe les deux éléments ci-dessous.
- 📝 [Formulaire "Sauvegarde — Pool d'heures Natacha"](https://docs.google.com/forms/d/1oIk8QhXwUA3UnD3BcZTOfQuifEoZ7zK1s7qj8IPycF4/edit) — reçoit les envois de l'app. Natacha ne le voit jamais : l'app n'y soumet pas une réponse au sens classique, elle poste directement sur son endpoint technique (voir `CLAUDE.md` pour l'URL exacte et l'identifiant du champ).
- 📊 [Sheet "Sauvegarde — Pool d'heures Natacha (réponses)"](https://docs.google.com/spreadsheets/d/1NKIFuRmcNo8pkn9WXNzlZHjESljt0zcEDh89PCnBW9g/edit) — une ligne par envoi, horodatée. La dernière ligne reçue est toujours l'état le plus récent.

**Comment ça marche, en détail :**

1. **Photo complète, jamais un delta.** Chaque envoi contient la totalité des
   mouvements de Natacha, pas seulement ce qui vient de changer. La Sheet
   accumule donc un historique de photos successives — pratique pour remonter
   à un état antérieur si une suppression s'avère être une erreur.
2. **Format CSV**, le même que les boutons "Exporter" / "Restaurer" en bas de
   page de l'app : une ligne de la Sheet se recolle telle quelle dans l'app
   pour une restauration (voir plus bas).
3. **Aucune confirmation de réussite possible.** La requête part en mode
   technique `no-cors` (nécessaire pour poster sans compte Google ni serveur
   intermédiaire) : l'app sait que l'envoi est *parti*, jamais si Google l'a
   *enregistré*. Le pied de page de l'app affiche donc "Sauvegardé le …"
   (date du dernier envoi tenté) plutôt qu'un message de succès — et jamais de
   coche verte trompeuse.
4. **Hors ligne, rien ne se perd et rien ne bloque.** Natacha peut saisir ses
   heures sans réseau (l'app fonctionne hors ligne, voir *Installation sur le
   téléphone*). Un envoi qui échoue est mis en attente et renvoyé
   automatiquement dès que le réseau revient — le pied de page affiche alors
   "Hors ligne — sauvegarde en attente".
5. **Limite à surveiller, pas encore atteinte** : une cellule Google Sheets
   plafonne à 50 000 caractères. Au rythme d'usage actuel, ça laisse environ
   3 ans avant saturation. Le détail technique (et la méthode à suivre le jour
   venu — consolider, jamais supprimer l'historique) est dans `CLAUDE.md`.

### En complément

- Ajouter la page à l'écran d'accueil évite le nettoyage automatique des données par
  le navigateur (voir *Installation sur le téléphone* ci-dessus).
- "Exporter une sauvegarde" (bas de page) télécharge un fichier `.csv` lisible dans
  un tableur. "Restaurer une sauvegarde" recharge un fichier exporté ; "Coller une
  sauvegarde" fait la même chose à partir d'un texte collé — pratique pour renvoyer
  à Natacha le contenu d'une ligne copiée depuis la Google Sheet ci-dessus, sans
  manipuler de fichier sur son téléphone : Nico copie une ligne, l'envoie par
  message, Natacha la colle.

## Déploiement (GitHub Pages)

1. `index.html` doit rester à la racine du dépôt (ou dans `/docs`, à ajuster dans les
   paramètres Pages du dépôt en conséquence). `manifest.webmanifest`, `sw.js` et les
   quatre `*.png` doivent rester à ses côtés : ce sont eux qui rendent l'app
   installable sur Android et utilisable hors ligne.
2. Dans les paramètres du dépôt GitHub → *Pages* → *Source* : brancher sur la branche
   principale, dossier `/ (root)`.
3. L'application est ensuite accessible à `https://<utilisateur>.github.io/<repo>/`.

## Structure

- `index.html` — application complète (HTML + CSS + JS), aucune autre dépendance.
- Pas de build, pas de `package.json` : ouvrir le fichier directement ou le servir tel quel.
