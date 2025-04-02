////////////////////////////////////////////////////////////
//////////////////////////  UX/UI  /////////////////////////
////////////////////////////////////////////////////////////
const notificationTime = 3500;

// Envoi une notification
function notification(txt, type) {
    const notification = document.getElementById("notification");
    const content = document.getElementById("notification_content");
    content.innerHTML = txt

    // Adapte le style selon succès/erreur
    if (type == "suc") {
        notification.classList.add("btn_save");
    } if (type == "err") {
        notification.classList.add("btn_cancel");
    }

    // Affiche la notif
    notification.classList.remove("hidden");
    notification.classList.add("visible");
    setTimeout(() => {
        notification.classList.remove("visible");
        notification.classList.add("hidden");
        // Supprime le style après la notif
        notification.classList.remove("btn_cancel");
        notification.classList.remove("btn_save");
    }, notificationTime);
}
// Gestion des différentes pages (onglet)
function openTab(evt, TabName) {
    // Declare all variables
    var i, tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(TabName).style.display = "block";
    evt.currentTarget.className += " active";
    updateData();
}

////////////////////////////////////////////////////////////
////////////////////////  UTILITAIRE  //////////////////////
////////////////////////////////////////////////////////////
let importEnabled;

// Test d'import (selon server local ou pas)
async function testImport() {  
    const importButon = document.getElementById("importData");   
    
    try {
        // Récupère lun fichier dans le projet pour testé si fetch() est possible
        const response = await fetch('style.css');
        // Si la réponse est mauvaise, vérouille le bouton import et interdit l'import
        if (!response.ok) {
            importEnabled = false;
            importButon.classList.add("btn_lock");
            document.getElementById("text_import").innerText = `Ta configuration ne te permet pas d'importer un fichier JSON.`;
        // Sinon autorise l'import
        } else {
            importEnabled = true;
        }
        // En cas d'erreur, vérouille le bouton import et interdit l'import (sécurité)
    } catch (error) {
        importEnabled = false;
        importButon.classList.add("btn_lock");
        document.getElementById("text_import").innerText = `Ta configuration ne te permet pas d'importer un fichier JSON.`;
    }
}
// Import JSON
async function importData() {
    if (importEnabled == false) {
        return notification('Ta configuration ne te permet pas d\'importer un fichier.', 'err');
    }
    try {
        openModalConfirmation("Etes-vous sur de vouloir importer un fichier ? Cette action écrasera les données actuelle", async(confirmed) => {
            if (confirmed) {
                // Récupère les données depuis data.json
                const response = await fetch('import/data.json');
                if (!response.ok) {
                    notification("Erreur lors du chargement du fichier JSON", 'err');
                    throw new Error('Erreur lors du chargement du fichier JSON');
                }
                const data = await response.json();
                // Stocke les données dans le localStorage
                localStorage.setItem('budgetData', JSON.stringify(data));
                updateData();
                notification("Fichier importé avec succès", 'suc');
            }
        });
    } catch (error) {
        console.error('Erreur:', error);
        return;
    }
}
// Export JSON
async function exportData() {
    try {
        openModalConfirmation("Exporter les données ?", async(confirmed) => {
            if (confirmed) {
                // Récupère les données du localStorage
                const budgetData = localStorage.getItem('budgetData');
                
                if (!budgetData) {
                    notification("Aucune donnée à exporter", 'err');
                    throw new Error('Aucune donnée dans le localStorage');
                }
        
                // Crée un objet Blob avec les données
                const blob = new Blob([budgetData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // Crée un lien de téléchargement
                const a = document.createElement('a');
                a.href = url;
                a.download = 'data.json';
                
                // Déclenche le téléchargement
                document.body.appendChild(a);
                a.click();
                
                // Nettoie
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
                
                notification("Export réussie", 'suc');
            }
        });
    } catch (error) {
        notification(`Erreur lors de l'export`, 'err');
    }
}
// Chargement des données du localStorage
function loadData() {
    try {
        // 1. Récupération des données depuis le localStorage
        const storedData = localStorage.getItem('budgetData');
        
        // 2. Si aucune donnée n'existe
        if (!storedData) {
            const data = {
                revenus: [],
                depenses: [],
                echeances: []
            }
            saveData(data)
            notification("Données initialisées avec succès", 'suc');
            return {
                revenus: [],
                depenses: [],
                echeances: []
            };
        }
        
        // 3. Parse les données JSON
        const data = JSON.parse(storedData);
        
        // 4. Vérification de la structure des données
        if (!data.revenus || !data.depenses || !data.echeances) {
            notification("Structure de données invalide", 'err');
            throw new Error('Structure de données invalide');
        }

        // 5. Retourne l'objet formaté
        return {
            revenus: data.revenus || [],
            depenses: data.depenses || [],
            echeances: data.echeances || []
        };
    } catch (error) {
        notification("Erreur lors de la récupération des données", 'err');
        // Retourne un objet vide en cas d'erreur
        return {
            revenus: [],
            depenses: [],
            echeances: []
        };
    }
}
// Sauvegarde des données dans le localStorage
function saveData(data) {
    try {
      // 1. Validation des données
      if (!data || typeof data !== 'object') {
        throw new Error('Données invalides : doit être un objet');
      }
  
      // 2. Structure minimale requise
      const dataToSave = {
        revenus: Array.isArray(data.revenus) ? data.revenus : [],
        depenses: Array.isArray(data.depenses) ? data.depenses : [],
        echeances: Array.isArray(data.echeances) ? data.echeances : []
      };
  
      // 3. Validation des transactions individuelles (optionnel)
      const validateTransaction = (transaction) => {
        return (
          transaction &&
          typeof transaction === 'object' &&
          typeof transaction.label === 'string' &&
          typeof transaction.montant === 'number' &&
          transaction.date
        );
      };
  
      dataToSave.revenus = dataToSave.revenus.filter(validateTransaction);
      dataToSave.depenses = dataToSave.depenses.filter(validateTransaction);
      dataToSave.echeances = dataToSave.echeances.filter(t => validateTransaction(t) && Array.isArray(t.echeancier));
  
      // 4. Sauvegarde dans le localStorage
      localStorage.setItem('budgetData', JSON.stringify(dataToSave));
      
      console.log('Données sauvegardées avec succès');
      return true;
  
    } catch (error) {
      console.error('Erreur lors de la sauvegarde :', error);
      return false;
    }
}
// Création d'un identifiant unique
function generateId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `${timestamp}t-b${randomPart}`;
}

////////////////////////////////////////////////////////////
///////////////////  UPDATE DES TABLEAUX  //////////////////
////////////////////////////////////////////////////////////

// Ajouter une entrée 
function ajouterItem(itemType) {
    // 1. Configuration en fonction du type
    const config = {
        revenu: {
            iconButtonId: 'icon_button_revenu',
            dateId: 'select_date_revenu',
            labelId: 'select_label_revenu',
            montantId: 'select_montant_revenu',
            entryButtonId: 'new_entry_revenu',
            dataKey: 'revenus',
            defaultIcon: 'fa-solid fa-tag',
            successMessage: 'Revenu ajouté avec succès',
            buttonText: 'Ajouter un revenu'
        },
        depense: {
            iconButtonId: 'icon_button_depense',
            dateId: 'select_date_depense',
            labelId: 'select_label_depense',
            montantId: 'select_montant_depense',
            entryButtonId: 'new_entry_depense',
            dataKey: 'depenses',
            defaultIcon: 'fa-solid fa-tag',
            successMessage: 'Dépense ajoutée avec succès',
            buttonText: 'Ajouter une dépense'
        },
        echeance: {
            iconButtonId: 'icon_button_echeance',
            dateId: 'select_date_echeance',
            labelId: 'select_label_echeance',
            montantId: 'select_montant_echeance',
            entryButtonId: 'new_entry_echeance',
            dataKey: 'echeances',
            defaultIcon: 'fa-solid fa-tag',
            successMessage: 'Échéance ajoutée avec succès',
            buttonText: 'Ajouter'
        }
    };

    const {
        iconButtonId,
        dateId,
        labelId,
        montantId,
        dataKey,
        defaultIcon,
        successMessage,
    } = config[itemType];

    // 2. Récupération des valeurs du formulaire
    const iconElement = document.getElementById(iconButtonId).querySelector('i');
    const iconClass = iconElement.className !== "fa-solid fa-list" 
        ? iconElement.className 
        : defaultIcon;
    
    const date = document.getElementById(dateId).value;
    const label = document.getElementById(labelId).value.trim();
    const montant = parseFloat(document.getElementById(montantId).value);

    // 3. Validation des données
    if (!label || isNaN(montant) || montant <= 0) {
        notification('Veuillez remplir les champs obligatoires *', 'err');
        return;
    }

    // 4. Création du nouvel objet
    const newItem = {
        id: generateId(),
        icon: iconClass,
        date: date,
        label: label,
        montant: montant
    };

    // Ajout spécifique pour les échéances
    if (itemType === 'echeance') {
        newItem.echeancier = [];
    }

    // 5. Mise à jour des données
    const budgetData = JSON.parse(localStorage.getItem('budgetData')) || { 
        revenus: [], 
        depenses: [], 
        echeances: [] 
    };
    
    budgetData[dataKey].push(newItem);
    localStorage.setItem('budgetData', JSON.stringify(budgetData));

    // 6. Réinitialisation du formulaire
    document.getElementById(iconButtonId).innerHTML = '<i class="fa-solid fa-list"></i>';
    document.getElementById(dateId).value = '';
    document.getElementById(labelId).value = '';
    document.getElementById(montantId).value = '';

    // 7. Mise à jour de l'affichage
    updateData();

    // 8. Notification
    notification(successMessage, 'suc');
}
// Ajouter une entrée 
function ajouterItemEcheance(echeanceId) {
    // 1. Récupération des valeurs du formulaire
    const date = document.getElementById(`select_date_cat_${echeanceId}`).value;
    const label = document.getElementById(`select_label_cat_${echeanceId}`).value.trim();
    const montant = parseFloat(document.getElementById(`select_montant_cat_${echeanceId}`).value);

    // 2. Validation des données
    if (!label || isNaN(montant) || montant <= 0) {
        notification('Veuillez remplir les champs obligatoires *', 'err');
        return;
    }

    // 3. Récupération des données existantes
    const budgetData = JSON.parse(localStorage.getItem('budgetData')) || { 
        revenus: [], 
        depenses: [], 
        echeances: [] 
    };

    // 4. Recherche et mise à jour de l'échéance correspondante
    const echeance = budgetData.echeances.find(e => e.id === echeanceId);
    if (!echeance) {
        notification("Échéance introuvable", 'err');
        return;
    }

    // 5. Création du nouvel échéancier
    const newEcheancier = {
        id: generateId(),
        icon: echeance.icon,
        date_echeance: date || 'rien', // 'rien' si date vide
        label_echeance: label,
        montant_echeance: montant
    };

    // 6. Ajout du nouvel échéancier
    echeance.echeancier.push(newEcheancier);

    // 7. Sauvegarde des données
    localStorage.setItem('budgetData', JSON.stringify(budgetData));

    // 8. Réinitialisation du formulaire
    document.getElementById('select_date_cat').value = '';
    document.getElementById('select_label_cat').value = '';
    document.getElementById('select_montant_cat').value = '';

    // 9. Mise à jour de l'affichage
    updateDataEcheances();

    // 10. Feedback visuel
    notification("Nouvelle entrée ajouté", 'suc');
}
// Tableau global (Vue d'ensemble)
function updateDataGlobal() {
    const data = loadData();

    const tableGlobalDepenses = document.querySelector('#table_globalView tbody');
    tableGlobalDepenses.innerHTML = '';

    let total_revenus_global = 0;
    let total_depenses_global = 0;

    // Calculer les dépenses
    data.revenus.forEach(revenu => {
        total_revenus_global += revenu.montant;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="td_Icone"><i class="fa-regular fa-chart-line-up"></i></td>
            <td class="td_Label">${revenu.label}</td>
            <td class="td_Revenu">+ ${revenu.montant} €</td>
            <td class="td_Depense"></td>
        `;
        tableGlobalDepenses.appendChild(row);
    });

    // Calculer les dépenses
    data.depenses.forEach(depense => {
        total_depenses_global += depense.montant;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="td_Icone"><i class="fa-regular fa-chart-line-down"></i></td>
            <td class="td_Label">${depense.label}</td>
            <td class="td_Revenu"></td>
            <td class="td_Depense">- ${depense.montant} €</td>
        `;
        tableGlobalDepenses.appendChild(row);
    });
    let total_reste_global = total_revenus_global - total_depenses_global;

    document.getElementById('total_revenus_global').textContent = total_revenus_global.toFixed(2) + ' €';
    document.getElementById('total_depenses_global').textContent = total_depenses_global.toFixed(2) + ' €';
    const total_reste = document.getElementById('total_reste_global');
    total_reste.textContent = total_reste_global.toFixed(2) + ' €';
    
    total_reste.className = total_reste_global <= 0 ? 'total_Reste_negatif' : 'total_Reste_positif';
}
// Tableaux (Revenus et Dépenses)
function updateDataTable(tableType) {
    // 1. Configuration en fonction du type
    const config = {
        revenu: {
            tableId: 'table_revenus',
            dataKey: 'revenus',
            checkboxClass: 'revenu-checkbox',
            totalId: 'total_revenus',
            itemType: 'revenu'
        },
        depense: {
            tableId: 'table_depenses',
            dataKey: 'depenses',
            checkboxClass: 'depense-checkbox',
            totalId: 'total_depenses',
            itemType: 'depense'
        }
    };

    const { tableId, dataKey, checkboxClass, totalId, itemType } = config[tableType];
    const data = loadData();
    
    // 2. Récupération des éléments DOM
    const tableBody = document.querySelector(`#${tableId} tbody`);
    tableBody.innerHTML = '';
    let total = 0;

    // 3. Génération des lignes du tableau
    data[dataKey].forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="td_Icone"><i class="${item.icon}"></i></td>
            <td class="td_Date">${item.date}</td>
            <td class="td_Label">${item.label}</td>
            <td class="td_Montant">${item.montant.toFixed(2)} €</td>
            <td class="td_Action">
                <i class="fa-regular fa-pen btn_2" onclick="openEditModal('${item.id}', '${itemType}')"></i>
                <i class="fa-solid fa-trash-xmark btn_2" onclick="deleteItem('${item.id}', '${itemType}')"></i>
            </td>
            <td class="td_Check">
                <label>
                    <input type="checkbox" class="${checkboxClass}" checked data-montant="${item.montant}">
                    <span class="custom-checkbox"></span>
                </label>
            </td>
        `;
        tableBody.appendChild(row);
        total += item.montant;
    });

    // 4. Mise à jour du total
    document.getElementById(totalId).textContent = total.toFixed(2) + ' €';

    // 5. Gestion des événements (délégation)
    document.querySelector(`#${tableId}`).addEventListener('change', (e) => {
        if (e.target.classList.contains(checkboxClass)) {
            updateTable(itemType, dataKey);
        }
    });
}
// Tableaux (Échéances)
function updateDataEcheances() {
    const dataE = loadData();

    const echeancesContainer = document.getElementById('echeances_container');
    const echeancesContainerContent = document.getElementById('echeances_container_content');
    
    // Réinitialisation des totaux
    let total_echeances_global = 0;
    let total_reste_echeances_global = 0;
    
    // Construction du tableau global
    let tableBody = `
        <table>
            <thead>
                <tr>
                    <th class=""></th>
                    <th class="th_Date">Date</th>
                    <th class="th_Label">Label</th>
                    <th class="th_Montant">Montant</th>
                    <th class="th_Action">Action</th>
                </tr>
            </thead>
            <tbody>`;

    // Construction des détails
    let detailTables = '';
    
    dataE.echeances.forEach(echeance => {
        // Calcul du total global
        total_echeances_global += echeance.montant;
        
        // Ligne du tableau principal
        tableBody += `
            <tr>
                <td class="td_Icone"><i class="${echeance.icon}"></i></td>
                <td class="td_Date">${echeance.date}</td>
                <td class="td_Label">${echeance.label}</td>
                <td class="td_Montant">${echeance.montant.toFixed(2)} €</td>
                <td class="td_Action">
                    <i class="fa-regular fa-pen btn_2" onclick="openEditModal('${echeance.id}', 'echeance')"></i>
                    <i class="fa-solid fa-trash-xmark btn_2" onclick="deleteItem('${echeance.id}', 'echeance')"></i>
                </td>
            </tr>`;
        
        // Tableau détaillé pour chaque échéance
        let totalPaye = 0;
        let detailTable = `
            <div class="echeance-detail top-radius">
                <h3>${echeance.label} (${echeance.montant.toFixed(2)} €)</h3>
                <table>
                    <thead>
                        <tr>
                            <th class=""></th>
                            <th class="th_Date">Date</th>
                            <th class="th_Label">Label</th>
                            <th class="th_Montant">Montant</th>
                            <th class="th_Action">Action</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        echeance.echeancier.forEach(element => {
            totalPaye += element.montant_echeance;
            
            detailTable += `
                <tr>
                    <td class="td_Icone"><i class="${element.icon}"></i></td>
                    <td class="td_Date">${element.date_echeance}</td>
                    <td class="td_Label">${element.label_echeance}</td>
                    <td class="td_Montant">${element.montant_echeance.toFixed(2)} €</td>
                    <td class="td_Action">
                        <i class="fa-regular fa-pen btn_2" onclick="openEditModal('${element.id}', 'echeancier')"></i>
                        <i class="fa-solid fa-trash-xmark btn_2" onclick="deleteItem('${element.id}', 'echeancier')"></i>
                    </td>
                </tr>
                `;
        });

        const reste = echeance.montant - totalPaye;
        total_reste_echeances_global += reste;
        
        detailTable += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td class="label_Reste" colspan="3">Reste à payer :</td>
                            <td class="${reste <= 0 ? 'total_Reste_positif' : 'total_Reste_negatif'}" colspan="2">
                                ${reste.toFixed(2)} €
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="new_entry_echeance bottom-radius">
                <h4>Ajouter une entrée à ${echeance.label} :</h4>
                <div class="new_entry_echeance_content">
                    <input type="text" name="date_cat" id="select_date_cat_${echeance.id}" class="select_date" placeholder="Date" required>
                    <input type="text" name="label_cat" id="select_label_cat_${echeance.id}" placeholder="Label *">
                    <input type="number" name="montant_cat" id="select_montant_cat_${echeance.id}" min="0" placeholder="Montant *" required>
                    <div class="btn_3" onclick="ajouterItemEcheance('${echeance.id}')">Ajouter</div>
                </div>
            </div>`;
        
        detailTables += detailTable;
    });
    
    // Finalisation du tableau global
    tableBody += `
            </tbody>
            <tfoot>
                <tr>
                    <td class="label_Reste" colspan="3">Total restant :</td>
                    <td class="${total_reste_echeances_global <= 0 ? 'total_Reste_positif' : 'total_Reste_negatif'}" colspan="2">
                        ${total_reste_echeances_global.toFixed(2)} €
                    </td>
                </tr>
            </tfoot>
        </table>`;
    
    // Injection dans le DOM
    echeancesContainer.innerHTML = tableBody;
    echeancesContainerContent.innerHTML = detailTables;
}
// Calculer et mettre à jour les totaux
function updateTable(itemType, dataKey) {
    let newTotal = 0;
    document.querySelectorAll(`.${itemType}-checkbox:checked`).forEach(checkbox => {
        newTotal += parseFloat(checkbox.dataset.montant);
    });
    document.getElementById(`total_${dataKey}`).textContent = newTotal.toFixed(2) + ' €';
}
// Met à jour les données de tous les tableaux
function updateData() {
    updateDataTable('revenu'); // Pour les revenus
    updateDataTable('depense'); // Pour les dépenses
    updateDataEcheances()
    updateDataGlobal();
}

////////////////////////////////////////////////////////////
//////////////////////////  MODAL  /////////////////////////
////////////////////////////////////////////////////////////
let modalConfirmOpen = false;
let currentCallback = null;

// Fonction pour ouvrir la modal de confirmation // ---> CONFIRMATION
function openModalConfirmation(message, callback) {
    const modalConfirm = document.getElementById('modal_confirmation');
    const messageConfirm = document.getElementById('message_confirmation');
    
    // Stocker le callback
    currentCallback = callback;
    
    // Mettre à jour le message
    messageConfirm.textContent = message;
    
    // Ouvrir la modal
    modalConfirm.style.display = 'flex';
    modalConfirmOpen = true;
}
// Fonction pour confirmer l'action
function confirmAction() {
    if (currentCallback) {
        currentCallback(true); // Exécuter le callback avec true pour confirmation
    }
    closeModalConfirmation();
}
// Fonction pour annuler l'action
function cancelAction() {
    if (currentCallback) {
        currentCallback(false); // Exécuter le callback avec false pour annulation
    }
    closeModalConfirmation();
}
// Fonction pour fermer la modal
function closeModalConfirmation() {
    const modalConfirm = document.getElementById('modal_confirmation');
    modalConfirm.style.display = 'none';
    modalConfirmOpen = false;
    currentCallback = null;
}
// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Écouteurs pour les boutons de la modal
    document.getElementById('confirm_yes').addEventListener('click', confirmAction);
    document.getElementById('confirm_no').addEventListener('click', cancelAction);
    
    // Fermer la modal en cliquant à l'extérieur
    document.getElementById('modal_confirmation').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal_confirmation')) {
            cancelAction();
        }
    });
});

// Fonction pour ouvrir la modal d'édition // ---> ÉDITION
function openEditModal(itemId, itemType) {
    // 1. Récupérer les données existantes
    const budgetData = JSON.parse(localStorage.getItem('budgetData')) || { 
        revenus: [], depenses: [], echeances: [] 
    };
    
    // 2. Trouver l'élément à éditer selon son type
    let itemToEdit;
    let category;
    let parentEcheance = null;
    
    switch(itemType) {
        case 'revenu':
            category = 'revenus';
            itemToEdit = budgetData.revenus.find(item => item.id === itemId);
            break;
        case 'depense':
            category = 'depenses';
            itemToEdit = budgetData.depenses.find(item => item.id === itemId);
            break;
        case 'echeance':
            category = 'echeances';
            itemToEdit = budgetData.echeances.find(item => item.id === itemId);
            break;
        case 'echeancier':
            // Cas spécial pour les échéanciers
            for (const echeance of budgetData.echeances) {
                itemToEdit = echeance.echeancier.find(e => e.id === itemId);
                if (itemToEdit) {
                    parentEcheance = echeance;
                    category = 'echeancier';
                    break;
                }
            }
            break;
        default:
            console.error('Type d\'élément inconnu');
            return;
    }

    if (!itemToEdit) {
        notification('Élément introuvable', 'err');
        return;
    }

    // 3. Préparer la modal
    const modal = document.getElementById('modal_edite_value');
    const iconSelect = document.getElementById('icon_list_cat');
    const iconButton = document.getElementById('icon_button_cat');
    initIconList(iconSelect, 'icon_button_cat');
    // Afficher le sélecteur d'icône pour les échéanciers aussi
    document.querySelector('.custom_select').style.display = 'block';
    
    // 4. Pré-remplir les champs
    const iconToShow = itemToEdit.icon || (parentEcheance?.icon || 'fa-solid fa-tag');
    iconButton.innerHTML = `<i class="${iconToShow}"></i>`;
    
    document.getElementById('select_date_cat').value = 
        itemToEdit.date || itemToEdit.date_echeance || '';
    
    document.getElementById('select_label_cat').value = 
        itemToEdit.label || itemToEdit.label_echeance || '';
    
    document.getElementById('select_montant_cat').value = 
        itemToEdit.montant || itemToEdit.montant_echeance || '';

    // 5. Stocker le contexte dans la modal
    modal.dataset.itemId = itemId;
    modal.dataset.itemType = itemType;
    modal.dataset.category = category;
    if (parentEcheance) {
        modal.dataset.parentEcheanceId = parentEcheance.id;
    }
    
    // 6. Ouvrir la modal
    modal.style.display = 'flex';
    
    // 7. Initialiser la liste des icônes
    initIconList(iconSelect, 'icon_button_cat');
}
// Fonction pour supprimer une valeur
function deleteItem(itemId, itemType) {
    try {
        // 1. Demande de confirmation
        openModalConfirmation("Supprimer ?", async(confirmed) => {
            if (confirmed) {
                // 2. Récupération des données
                const budgetData = JSON.parse(localStorage.getItem('budgetData')) || {
                    revenus: [],
                    depenses: [],
                    echeances: []
                };
        
                // 3. Recherche et suppression selon le type
                let found = false;
                
                switch(itemType) {
                    case 'revenu':
                        budgetData.revenus = budgetData.revenus.filter(item => item.id !== itemId);
                        found = budgetData.revenus.length !== budgetData.revenus.originalLength;
                        break;
                        
                    case 'depense':
                        budgetData.depenses = budgetData.depenses.filter(item => item.id !== itemId);
                        found = budgetData.depenses.length !== budgetData.depenses.originalLength;
                        break;
                        
                    case 'echeance':
                        budgetData.echeances = budgetData.echeances.filter(item => item.id !== itemId);
                        found = budgetData.echeances.length !== budgetData.echeances.originalLength;
                        break;
                        
                    case 'echeancier':
                        // Cas spécial pour les échéanciers imbriqués
                        for (const echeance of budgetData.echeances) {
                            const initialLength = echeance.echeancier.length;
                            echeance.echeancier = echeance.echeancier.filter(e => e.id !== itemId);
                            if (echeance.echeancier.length !== initialLength) {
                                found = true;
                                break;
                            }
                        }
                        break;
                        
                    default:
                        notification("Type d'élément inconnu", 'err');
                        return;
                }
        
                // 4. Vérification et sauvegarde
                if (!found) {
                    notification("Élément introuvable", 'err');
                    return;
                }
        
                localStorage.setItem('budgetData', JSON.stringify(budgetData));
                notification("Élément supprimé avec succès", 'suc');
                
                // 5. Mise à jour de l'affichage
                updateData(); // Fonction globale qui rafraîchit l'interface
            }
        });
    } catch (error) {
        notification("Erreur lors de la suppression", 'err');
    }
}
// Fonction pour sauvegarder
function saveValue() {
    const modal = document.getElementById('modal_edite_value');
    const itemId = modal.dataset.itemId;
    const itemType = modal.dataset.itemType;
    const category = modal.dataset.category;
    const parentEcheanceId = modal.dataset.parentEcheanceId;
    
    // 1. Récupérer les valeurs
    const newIcon = document.getElementById('icon_button_cat').querySelector('i').className;
    const newDate = document.getElementById('select_date_cat').value;
    const newLabel = document.getElementById('select_label_cat').value.trim();
    const newMontant = parseFloat(document.getElementById('select_montant_cat').value);
    
    // 2. Validation
    if (!newLabel || isNaN(newMontant)) {
        notification('Veuillez remplir les champs obligatoires *', 'err');
        return;
    }

    // 3. Mettre à jour les données
    const budgetData = JSON.parse(localStorage.getItem('budgetData'));
    
    if (itemType === 'echeancier') {
        // Cas spécial pour les échéanciers
        const parentEcheance = budgetData.echeances.find(e => e.id === parentEcheanceId);
        if (parentEcheance) {
            const echeancier = parentEcheance.echeancier.find(e => e.id === itemId);
            if (echeancier) {
                echeancier.icon = newIcon;
                echeancier.date_echeance = newDate;
                echeancier.label_echeance = newLabel;
                echeancier.montant_echeance = newMontant;
            }
        }
    } else {
        // Cas standard
        const item = budgetData[category].find(item => item.id === itemId);
        if (item) {
            item.icon = newIcon;
            item.date = newDate;
            item.label = newLabel;
            item.montant = newMontant;
        }
    }

    // 4. Sauvegarder et mettre à jour
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
    modal.style.display = 'none';
    updateData();
    notification('Modifications enregistrées', 'suc');
}
// Fonctions utilitaires
function closeModal() {
    document.getElementById('modal_edite_value').style.display = 'none';
    document.getElementById('modal_confirmation').style.display = 'none';
}

////////////////////////////////////////////////////////////
//////////////////////////  ICONE  /////////////////////////
////////////////////////////////////////////////////////////

// Renvoi la liste des icones disponible
function loadIcons() {
    // Charger les icônes dynamiquement à partir du fichier JSON
    const icons = [
        "fa-solid fa-euro-sign",
        "fa-solid fa-credit-card",
        "fa-solid fa-money-bill-wave",
        "fa-solid fa-hand-holding-dollar",
        "fa-solid fa-landmark",
        "fa-solid fa-house",
        "fa-solid fa-bolt",
        "fa-solid fa-droplet",
        "fa-solid fa-car",
        "fa-solid fa-truck",
        "fa-solid fa-wifi",
        "fa-solid fa-phone",
        "fa-solid fa-mobile-screen",
        "fa-solid fa-suitcase-medical",
        "fa-solid fa-gamepad",
        "fa-solid fa-cart-shopping",
        "fa-solid fa-burger-soda",
        "fa-solid fa-dumbbell",
        "fa-solid fa-shirt",
        "fa-solid fa-mug-hot",
        "fa-solid fa-film",
        "fa-solid fa-music",
        "fa-solid fa-trash-can",
        "fa-solid fa-briefcase",
        "fa-solid fa-earth-americas",
        "fa-solid fa-plane",
        "fa-solid fa-store",
        "fa-solid fa-robot",
        "fa-solid fa-lock",
        "fa-solid fa-palette",
    ]
    return icons;
}
// Initialiser les icones
function initIconList(container, buttonId) {
    const icons = loadIcons();
    container.innerHTML = '';
    
    // Assure que la liste est cachée au départ
    container.style.display = 'none';
    
    icons.forEach(icon => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            document.getElementById(buttonId).innerHTML = `<i class="fa-solid ${icon}"></i>`;
            container.style.display = 'none';
        });
        container.appendChild(li);
    });
    
    document.getElementById(buttonId).addEventListener('click', (e) => {
        e.stopPropagation();
        // Fermer toutes les autres listes
        const allLists = [
            document.getElementById('icon_list_revenu'),
            document.getElementById('icon_list_depense'), 
            document.getElementById('icon_list_echeance'),
            document.getElementById('icon_list_cat')
        ];
        
        allLists.forEach(list => {
            if (list && list !== container) list.style.display = 'none';
        });
        
        // Basculer l'affichage de la liste actuelle
        container.style.display = container.style.display === 'none' ? 'flex' : 'none';
    });
    
    document.addEventListener('click', () => {
        container.style.display = 'none';
    });
}

////////////////////////////////////////////////////////////
//////////////////  CHARGEMENT DE LA PAGE  /////////////////
////////////////////////////////////////////////////////////

// Ouvre la vue d'ensemble au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    // Test pour activer/désactiver l'import de fichier JSON
    testImport();

    // Met à jour tous les tableaux
    updateData();

    // Initialisation des trois sélecteurs d'icônes
    initIconList(document.getElementById('icon_list_revenu'), 'icon_button_revenu');
    initIconList(document.getElementById('icon_list_depense'), 'icon_button_depense');
    initIconList(document.getElementById('icon_list_echeance'), 'icon_button_echeance');
    initIconList(document.getElementById('icon_list_cat'), 'icon_button_cat');

    // Affiche la page par défaut
    document.getElementById("default").click();
});