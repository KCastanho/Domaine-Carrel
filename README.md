
# Domaine Carrel — Alerte Mildiou

Application web d'aide à la décision développée dans le cadre du TP noté de Stratégie IA — B3 DEV.

## Contexte

Le Domaine Carrel est une exploitation viticole fictive de 14 hectares située en Bourgogne, composée de 6 salariés et disposant d'un budget de 12 000 €.

En 2024, le mildiou a détruit 30 % de sa récolte, représentant environ 430 000 € de chiffre d'affaires perdu.

L'objectif du projet est d'anticiper les risques de mildiou afin de protéger les récoltes et d'optimiser les traitements.

## Fonctionnalités

- Chargement des données météorologiques depuis un fichier JSON.
- Affichage des prévisions sur 7 jours.
- Analyse indépendante des parcelles Haut et Bas.
- Application automatique de la règle des 3 × 10.
- Identification des journées à risque.
- Génération d'un SMS d'alerte selon le jour sélectionné.
- Interface responsive.

## Règle des 3 × 10

Une alerte est générée lorsque les trois conditions suivantes sont réunies :

- Température supérieure à 10 °C.
- Précipitations supérieures à 10 mm.
- Pousses de vigne supérieures à 10 cm.

## Choix technologiques

- HTML5
- CSS3
- JavaScript natif
- JSON

Famille de modèle : Prédire.

Le prototype utilise un algorithme déterministe à base de règles. Il ne nécessite aucune API d'intelligence artificielle, aucun entraînement et aucune dépendance externe.

## Structure du projet

```text
domaine-carrel/
├── index.html
├── style.css
├── script.js
├── data.json
└── README.md
```

## Installation et lancement

Cloner le dépôt GitHub, puis se placer dans le dossier du projet.

Lancer un serveur HTTP local :

```bash
python3 -m http.server 8000
```

Ouvrir ensuite le navigateur à l'adresse :

http://localhost:8000

## Résultats attendus

| Jour | Parcelle Haut | Parcelle Bas |
|---|---|---|
| Lundi | Sans alerte | À risque |
| Mardi | À risque | Sans alerte |
| Mercredi | Sans alerte | Sans alerte |
| Jeudi | À risque | Sans alerte |
| Vendredi | Sans alerte | À risque |
| Samedi | À risque | Sans alerte |
| Dimanche | Sans alerte | À risque |

## Limites du prototype

- Utilisation de données météorologiques fictives.
- Absence de prévisions météorologiques en temps réel.
- Règle simplifiée d'estimation du risque.
- Simulation des SMS sans envoi réel.
- Absence de mode hors connexion.
- Efficacité agronomique non validée sur le terrain.

## Évolutions possibles

- Connexion à une API météorologique.
- Intégration des stations météo du domaine.
- Envoi automatique des SMS chaque matin.
- Fonctionnement hors connexion.
- Validation à partir des six années de données historiques.

## Place de l'humain

L'application constitue un outil d'aide à la décision et ne remplace pas l'expérience du vigneron.

L'absence d'alerte ne garantit pas l'absence de maladie. La décision finale de traitement appartient au vigneron et doit respecter la réglementation.

## Cadre du projet

TP noté — Stratégie IA — B3 DEV
