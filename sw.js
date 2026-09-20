// Service worker minimal du pool d'heures.
//
// Deux raisons d'exister :
//  1. Android (Chrome / Samsung Internet) exige un service worker avec un
//     gestionnaire "fetch" pour proposer une vraie installation ; sans lui,
//     "Ajouter a l'ecran d'accueil" ne cree qu'un marque-page de navigateur.
//  2. L'app reste utilisable sans reseau.
//
// La version vient du parametre ?v= pose par index.html, pour n'avoir qu'un
// seul numero a maintenir (APP_VERSION).

const VERSION = new URL(self.location).searchParams.get("v") || "dev";
const CACHE = "pool-heures-" + VERSION;
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Reseau d'abord : des que Natacha a du signal, elle voit la derniere version.
// Le cache ne sert que de filet hors ligne — pas de version figee.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if(request.method !== "GET") return;
  if(new URL(request.url).origin !== self.location.origin) return; // polices Google : reseau direct

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match("./index.html")))
  );
});
