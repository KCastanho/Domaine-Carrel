
let donnees;
let traitements = [];

// ==============================
// CHARGEMENT DES DONNÉES
// ==============================

async function chargerDonnees() {
    try {
        const response = await fetch("data.json");

        if (!response.ok) {
            throw new Error("Impossible de charger les données.");
        }

        donnees = await response.json();

        afficherResultats();
        genererSMS();
        initialiserSuivi();

    } catch (erreur) {
        console.error(erreur);

        document.getElementById("resultats").textContent =
            "Erreur lors du chargement des données.";

        document.getElementById("sms").textContent =
            "Impossible de générer le SMS.";

        document.getElementById("statut-traitements").textContent =
            "Impossible d'initialiser le suivi environnemental.";
    }
}

// ==============================
// RÈGLE DES 3 × 10
// ==============================

function risqueMildiou(temperature, pluie, pousses) {
    return temperature > 10 && pluie > 10 && pousses > 10;
}

// ==============================
// PRÉVISIONS MÉTÉOROLOGIQUES
// ==============================

function afficherResultats() {
    const resultats = document.getElementById("resultats");

    resultats.innerHTML = "";

    donnees.parcelles.forEach(parcelle => {
        let html = `
            <section class="parcelle">
                <h2>${parcelle.nom}</h2>

                <table>
                    <thead>
                        <tr>
                            <th>Jour</th>
                            <th>Température</th>
                            <th>Pluie</th>
                            <th>Risque</th>
                        </tr>
                    </thead>

                    <tbody>
        `;

        parcelle.meteo.forEach(meteo => {
            const risque = risqueMildiou(
                meteo.temperature,
                meteo.pluie,
                donnees.pousses
            );

            html += `
                <tr>
                    <td>${meteo.jour}</td>
                    <td>${meteo.temperature} °C</td>
                    <td>${meteo.pluie} mm</td>

                    <td>
                        <span class="${risque ? "danger" : "safe"}">
                            ${risque ? "À risque" : "Sans alerte"}
                        </span>
                    </td>
                </tr>
            `;
        });

        html += "</tbody></table></section>";

        resultats.innerHTML += html;
    });
}

// ==============================
// GÉNÉRATION DU SMS
// ==============================

function genererSMS() {
    if (!donnees) return;

    const jour = document.getElementById("jour").value;
    const alertes = [];

    donnees.parcelles.forEach(parcelle => {
        const meteo = parcelle.meteo.find(
            m => m.jour === jour
        );

        if (
            meteo &&
            risqueMildiou(
                meteo.temperature,
                meteo.pluie,
                donnees.pousses
            )
        ) {
            alertes.push(
                `${parcelle.nom} : ${meteo.temperature} °C, ` +
                `${meteo.pluie} mm de pluie, ` +
                `pousses de ${donnees.pousses} cm.`
            );
        }
    });

    const sms = document.getElementById("sms");

    if (alertes.length > 0) {
        sms.textContent =
            `Domaine Carrel - ${jour}\n` +
            "Alerte mildiou !\n" +
            alertes.join("\n") +
            "\nInspection recommandée.";

        sms.classList.add("sms-danger");

    } else {
        sms.textContent =
            `Domaine Carrel - ${jour}\n` +
            "Aucune alerte selon la règle des 3 × 10. " +
            "Maintenir la surveillance habituelle.";

        sms.classList.remove("sms-danger");
    }
}

// ==============================
// INITIALISATION DU SUIVI
// ==============================

function initialiserSuivi() {
    if (
        !(donnees.surfaceDomaine > 0) ||
        !(donnees.traitementsReference > 0)
    ) {
        throw new Error("Référence environnementale manquante.");
    }

    try {
        const sauvegarde = JSON.parse(
            localStorage.getItem("traitementsCarrel") || "[]"
        );

        if (!Array.isArray(sauvegarde)) {
            throw new Error("Historique invalide.");
        }

        traitements = sauvegarde;

    } catch (erreur) {
        console.error(erreur);

        document.getElementById("statut-traitements").textContent =
            "Impossible de récupérer l'historique local.";

        return;
    }

    const maintenant = new Date();

    document.getElementById("annee-traitement").value =
        maintenant.getFullYear();

    definirDateActuelle();

    document.getElementById("reference").textContent =
        donnees.traitementsReference;

    document.getElementById("form-traitement")
        .addEventListener("submit", enregistrerTraitement);

    document.getElementById("annee-traitement")
        .addEventListener("change", afficherTraitements);

    document.getElementById("rapport-btn")
        .addEventListener("click", telechargerRapport);

    document.getElementById("enregistrer-btn").disabled = false;

    afficherTraitements();
}

function definirDateActuelle() {
    const maintenant = new Date();

    const annee = maintenant.getFullYear();

    const mois = String(
        maintenant.getMonth() + 1
    ).padStart(2, "0");

    const jour = String(
        maintenant.getDate()
    ).padStart(2, "0");

    document.getElementById("date-traitement").value =
        `${annee}-${mois}-${jour}`;
}

// ==============================
// SAUVEGARDE LOCALE
// ==============================

function sauvegarderTraitements(nouvelHistorique) {
    try {
        localStorage.setItem(
            "traitementsCarrel",
            JSON.stringify(nouvelHistorique)
        );

        traitements = nouvelHistorique;

        return true;

    } catch (erreur) {
        console.error(erreur);

        document.getElementById("statut-traitements").textContent =
            "Erreur : impossible de sauvegarder les traitements.";

        return false;
    }
}

// ==============================
// ENREGISTRER UN TRAITEMENT
// ==============================

function enregistrerTraitement(event) {
    event.preventDefault();

    const traitement = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),

        date: document.getElementById("date-traitement").value,

        parcelle: document.getElementById("parcelle-traitement").value,

        surface: Number(
            document.getElementById("surface-traitement").value
        ),

        produit: document.getElementById("produit-traitement")
            .value.trim(),

        dose: document.getElementById("dose-traitement")
            .value.trim()
    };

    const statut = document.getElementById("statut-traitements");

    // Vérification des données saisies

    if (
        !traitement.date ||
        !traitement.produit ||
        !traitement.dose ||
        !Number.isFinite(traitement.surface) ||
        traitement.surface <= 0 ||
        traitement.surface > donnees.surfaceDomaine
    ) {
        statut.textContent =
            "Veuillez renseigner des données valides.";

        return;
    }

    // Un traitement du domaine entier couvre 14 hectares.

    if (
        traitement.parcelle === "Domaine entier" &&
        traitement.surface !== donnees.surfaceDomaine
    ) {
        statut.textContent =
            `Le domaine entier représente ${donnees.surfaceDomaine} ha.`;

        return;
    }

    const nouvelHistorique = [...traitements, traitement];

    if (!sauvegarderTraitements(nouvelHistorique)) {
        return;
    }

    statut.textContent = "Traitement enregistré avec succès.";

    document.getElementById("annee-traitement").value =
        traitement.date.substring(0, 4);

    document.getElementById("form-traitement").reset();

    definirDateActuelle();

    afficherTraitements();
}

// ==============================
// SUPPRIMER UN TRAITEMENT
// ==============================

function supprimerTraitement(traitement) {
    const confirmation = confirm(
        "Voulez-vous vraiment supprimer ce traitement ?"
    );

    if (!confirmation) return;

    const nouvelHistorique = traitements.filter(
        t => t !== traitement
    );

    if (!sauvegarderTraitements(nouvelHistorique)) {
        return;
    }

    document.getElementById("statut-traitements").textContent =
        "Traitement supprimé.";

    afficherTraitements();
}

// ==============================
// CALCUL DES INDICATEURS
// ==============================

function calculerIndicateurs() {
    const annee =
        document.getElementById("annee-traitement").value;

    const historique = traitements.filter(
        traitement => traitement.date.startsWith(annee + "-")
    );

    const surfaceTotale = historique.reduce(
        (total, traitement) => total + Number(traitement.surface),
        0
    );

    const reference = donnees.traitementsReference;

    // Surface cumulée divisée par la surface du domaine.

    const equivalents =
        surfaceTotale / donnees.surfaceDomaine;

    // Pourcentage de réduction par rapport à la référence.

    const reduction =
        ((reference - equivalents) / reference) * 100;

    // Estimation proportionnelle des économies.

    const economies =
        (reference - equivalents) * 2200;

    return {
        annee,
        historique,
        surfaceTotale,
        reference,
        equivalents,
        reduction,
        economies
    };
}

// ==============================
// FORMATAGE DES VALEURS
// ==============================

function formatNombre(nombre, decimales = 2) {
    return nombre.toLocaleString("fr-FR", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    });
}

function formatEuro(nombre) {
    return nombre.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    });
}

function formatDate(date) {
    return date.split("-").reverse().join("/");
}

// ==============================
// AFFICHAGE DES TRAITEMENTS
// ==============================

function afficherTraitements() {
    const bilan = calculerIndicateurs();

    const tableau =
        document.getElementById("historique-traitements");

    tableau.innerHTML = "";

    const historique = [...bilan.historique].sort(
        (a, b) => b.date.localeCompare(a.date)
    );

    historique.forEach(traitement => {
        const ligne = tableau.insertRow();

        const valeurs = [
            formatDate(traitement.date),
            traitement.parcelle,
            formatNombre(Number(traitement.surface)) + " ha",
            traitement.produit,
            traitement.dose
        ];

        valeurs.forEach(valeur => {
            ligne.insertCell().textContent = valeur;
        });

        const celluleAction = ligne.insertCell();

        const bouton = document.createElement("button");

        bouton.textContent = "Supprimer";
        bouton.className = "btn-supprimer";
        bouton.type = "button";

        bouton.addEventListener("click", () => {
            supprimerTraitement(traitement);
        });

        celluleAction.appendChild(bouton);
    });

    const disponible = bilan.historique.length > 0;

    const totalElement =
        document.getElementById("total-traitements");

    const reductionElement =
        document.getElementById("reduction");

    const economiesElement =
        document.getElementById("economies");

    totalElement.textContent = disponible
        ? formatNombre(bilan.equivalents)
        : "—";

    reductionElement.textContent = disponible
        ? formatNombre(bilan.reduction, 1) + " %"
        : "—";

    economiesElement.textContent = disponible
        ? formatEuro(bilan.economies)
        : "—";

    reductionElement.classList.toggle(
        "positif",
        disponible && bilan.reduction > 0
    );

    reductionElement.classList.toggle(
        "negatif",
        disponible && bilan.reduction < 0
    );

    economiesElement.classList.toggle(
        "positif",
        disponible && bilan.economies > 0
    );

    economiesElement.classList.toggle(
        "negatif",
        disponible && bilan.economies < 0
    );

    document.getElementById("rapport-btn").disabled =
        !disponible;

    if (!disponible) {
        const ligne = tableau.insertRow();
        const cellule = ligne.insertCell();

        cellule.colSpan = 6;

        cellule.textContent =
            "Aucun traitement enregistré pour cette année.";

        cellule.className = "historique-vide";
    }
}

// ==============================
// RAPPORT ENVIRONNEMENTAL
// ==============================

function telechargerRapport() {
    const bilan = calculerIndicateurs();

    if (bilan.historique.length === 0) return;

    const historique = [...bilan.historique]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(traitement =>
            `${formatDate(traitement.date)} | ` +
            `${traitement.parcelle} | ` +
            `${traitement.surface} ha | ` +
            `${traitement.produit} | ` +
            `${traitement.dose}`
        ).join("\n");

    const rapport = `
==================================================
DOMAINE CARREL
RAPPORT DE SUIVI ENVIRONNEMENTAL
==================================================

Document provisoire — Prototype de démonstration

Date de génération : ${new Date().toLocaleDateString("fr-FR")}
Année analysée : ${bilan.annee}
Surface du domaine : ${donnees.surfaceDomaine} hectares

--------------------------------------------------
1. INDICATEURS ENVIRONNEMENTAUX
--------------------------------------------------

Traitements complets de référence : ${bilan.reference}

Nombre d'interventions enregistrées :
${bilan.historique.length}

Surface cumulée traitée :
${formatNombre(bilan.surfaceTotale)} hectares

Traitements complets équivalents :
${formatNombre(bilan.equivalents)}

Réduction provisoire par rapport à la référence :
${formatNombre(bilan.reduction, 1)} %

Économies brutes estimées :
${formatEuro(bilan.economies)}

--------------------------------------------------
2. HISTORIQUE DES TRAITEMENTS
--------------------------------------------------

Date | Parcelle | Surface | Produit | Dose

${historique}

--------------------------------------------------
3. OBJECTIF ENVIRONNEMENTAL
--------------------------------------------------

Passer de 9 à 7 traitements complets équivalents
par an, soit une réduction ciblée de 22,2 %.

Économies brutes potentielles : 4 400 EUR par an.

Cet objectif est hypothétique et doit être validé
sur le terrain.

--------------------------------------------------
4. OPPORTUNITÉ COMMERCIALE
--------------------------------------------------

Importateur japonais : 20 000 bouteilles par an.

Chiffre d'affaires potentiel : 360 000 EUR par an
au prix moyen de référence de 18 EUR par bouteille.

Le contrat est conditionné à la démonstration
d'une réduction des traitements phytosanitaires.

--------------------------------------------------
5. MÉTHODE DE CALCUL
--------------------------------------------------

Traitements complets équivalents =
Surface cumulée traitée / Surface du domaine.

Réduction =
(9 - Traitements équivalents) / 9 x 100.

Économies estimées =
(9 - Traitements équivalents) x 2 200 EUR.

--------------------------------------------------
6. LIMITES ET AVERTISSEMENTS
--------------------------------------------------

Ce rapport est généré par un prototype à partir
des données saisies manuellement.

Il ne constitue pas une certification environnementale
ni une preuve vérifiée de réduction des traitements.

La comparaison doit porter sur des saisons complètes
et comparables.

Les données doivent être rapprochées du carnet réel
des traitements et validées par le responsable du domaine.

Les économies sont estimées proportionnellement
à la surface traitée.

La quantité de produits, les doses utilisées et leur
impact environnemental doivent également être étudiés.

La décision finale de traitement reste humaine.

==================================================
Domaine Carrel - TP Stratégie IA - B3 DEV
==================================================
`;

    const fichier = new Blob([rapport.trim()], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(fichier);

    const lien = document.createElement("a");

    lien.href = url;

    lien.download =
        `rapport-environnemental-${bilan.annee}.txt`;

    document.body.appendChild(lien);

    lien.click();

    lien.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ==============================
// INITIALISATION DE L'APPLICATION
// ==============================

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("enregistrer-btn").disabled = true;

    document.getElementById("jour")
        .addEventListener("change", genererSMS);

    chargerDonnees();
});
