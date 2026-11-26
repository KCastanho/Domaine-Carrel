
let donnees;

// Chargement des données météorologiques
async function chargerDonnees() {
    try {
        const response = await fetch("data.json");

        if (!response.ok) {
            throw new Error("Impossible de charger les données.");
        }

        donnees = await response.json();

        afficherResultats();
        genererSMS();

    } catch (erreur) {
        console.error(erreur);
        document.getElementById("resultats").textContent =
            "Erreur lors du chargement des données.";
    }
}

// Application de la règle des 3 × 10
function risqueMildiou(temperature, pluie, pousses) {
    return temperature > 10 && pluie > 10 && pousses > 10;
}

// Affichage des prévisions par parcelle
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

// Génération du SMS quotidien
function genererSMS() {
    const jour = document.getElementById("jour").value;
    const alertes = [];

    donnees.parcelles.forEach(parcelle => {
        const meteo = parcelle.meteo.find(m => m.jour === jour);

        if (meteo && risqueMildiou(
            meteo.temperature,
            meteo.pluie,
            donnees.pousses
        )) {
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
            `Alerte mildiou !\n` +
            alertes.join("\n") +
            "\nInspection recommandée.";
    } else {
        sms.textContent =
            `Domaine Carrel - ${jour}\n` +
            "Aucune alerte selon la règle des 3 × 10. " +
            "Maintenir la surveillance habituelle.";
    }
}

// Initialisation de l'application
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("jour")
        .addEventListener("change", genererSMS);

    chargerDonnees();
});
