/**
 * Script Office TypeScript pour Excel Online
 * Met à jour les données sectorielles depuis l'API web
 * 
 * Instructions d'utilisation:
 * 1. Ouvrir Excel Online
 * 2. Aller dans Automatisation > Nouveau script
 * 3. Coller ce code
 * 4. Exécuter le script
 */

async function main(workbook: ExcelScript.Workbook) {
  // Configuration
  const SERVER_URL = "http://localhost:5000"; // À modifier selon votre configuration
  const API_SECTOR_ENDPOINT = "/api/sector";
  
  // Noms des onglets
  const SHEET_PARAMETERS = "Parameters";
  const SHEET_RAW_DATA = "RawData_SP500";
  const SHEET_CURRENT = "Current_SP500";
  
  try {
    // Récupérer les onglets
    const wsParameters = workbook.getWorksheet(SHEET_PARAMETERS);
    const wsRawData = workbook.getWorksheet(SHEET_RAW_DATA);
    const wsCurrent = workbook.getWorksheet(SHEET_CURRENT);
    
    if (!wsParameters || !wsRawData || !wsCurrent) {
      throw new Error("Onglets manquants. Vérifiez que Parameters, RawData_SP500 et Current_SP500 existent.");
    }
    
    // Récupérer l'URL du serveur depuis Parameters (cellule B1)
    const serverUrlRange = wsParameters.getRange("B1");
    const serverUrl = serverUrlRange.getValue() as string || SERVER_URL;
    
    // Récupérer l'horizon sélectionné (cellule B3)
    const horizonRange = wsParameters.getRange("B3");
    const horizon = horizonRange.getValue() as string || "B";
    
    // Appeler l'API
    const apiUrl = `${serverUrl}${API_SECTOR_ENDPOINT}`;
    console.log(`Appel API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    const jsonData = await response.json();
    
    if (!jsonData.success) {
      throw new Error(`Erreur API: ${jsonData.error}`);
    }
    
    const sectorData = jsonData.data;
    
    // Mettre à jour RawData_SP500
    updateRawData(wsRawData, sectorData);
    
    // Mettre à jour Current_SP500
    updateCurrentData(wsCurrent, sectorData);
    
    // Mettre à jour la date dans Parameters (cellule B2)
    const dateRange = wsParameters.getRange("B2");
    dateRange.setValue(new Date().toISOString());
    
    console.log("Données mises à jour avec succès!");
    
  } catch (error) {
    console.error("Erreur:", error);
    throw error;
  }
}

/**
 * Met à jour l'onglet RawData_SP500 avec toutes les données
 */
function updateRawData(worksheet: ExcelScript.Worksheet, sectorData: any) {
  // Effacer les anciennes données (garder les en-têtes)
  const dataRange = worksheet.getRange("A2:C1000");
  dataRange.clear(ExcelScript.ClearApplyTo.contents);
  
  let row = 2; // Commencer à la ligne 2 (ligne 1 = en-têtes)
  
  // Parcourir tous les rangs (Rank A à Rank J)
  for (let i = 1; i <= 10; i++) {
    const rankLetter = String.fromCharCode(64 + i); // A=65, B=66, etc.
    const rankKey = `Rank ${rankLetter}: Real-Time Performance`;
    
    if (sectorData[rankKey]) {
      const rankData = sectorData[rankKey];
      
      // Parcourir tous les secteurs
      for (const sectorName in rankData) {
        if (rankData.hasOwnProperty(sectorName)) {
          const timeframeCell = worksheet.getCell(row - 1, 0); // Colonne A (0-indexed)
          const sectorCell = worksheet.getCell(row - 1, 1);   // Colonne B
          const performanceCell = worksheet.getCell(row - 1, 2); // Colonne C
          
          timeframeCell.setValue(rankKey);
          sectorCell.setValue(sectorName);
          performanceCell.setValue(rankData[sectorName] / 100); // Convertir en décimal
          performanceCell.getFormat().setNumberFormat("0.00%");
          
          row++;
        }
      }
    }
  }
}

/**
 * Met à jour l'onglet Current_SP500 avec la matrice secteurs x horizons
 */
function updateCurrentData(worksheet: ExcelScript.Worksheet, sectorData: any) {
  // Effacer les données existantes
  const dataRange = worksheet.getRange("B2:K100");
  dataRange.clear(ExcelScript.ClearApplyTo.contents);
  
  // Récupérer la liste unique des secteurs depuis Rank A
  const rankAKey = "Rank A: Real-Time Performance";
  const sectors: string[] = [];
  
  if (sectorData[rankAKey]) {
    for (const sectorName in sectorData[rankAKey]) {
      if (sectorData[rankAKey].hasOwnProperty(sectorName)) {
        sectors.push(sectorName);
      }
    }
  }
  
  // Remplir les secteurs en colonne A (à partir de la ligne 2)
  for (let i = 0; i < sectors.length; i++) {
    const sectorCell = worksheet.getCell(i + 1, 0); // Ligne 2 = index 1
    sectorCell.setValue(sectors[i]);
  }
  
  // Remplir les performances par horizon (colonnes B à K)
  for (let i = 1; i <= 10; i++) {
    const rankLetter = String.fromCharCode(64 + i);
    const rankKey = `Rank ${rankLetter}: Real-Time Performance`;
    const col = i; // Colonne B = 1, C = 2, etc. (0-indexed)
    
    // En-tête de colonne (ligne 1, index 0)
    const headerCell = worksheet.getCell(0, col);
    headerCell.setValue(rankKey);
    
    if (sectorData[rankKey]) {
      const rankData = sectorData[rankKey];
      
      for (let row = 0; row < sectors.length; row++) {
        const sectorName = sectors[row];
        
        if (rankData[sectorName] !== undefined) {
          const perfCell = worksheet.getCell(row + 1, col);
          perfCell.setValue(rankData[sectorName] / 100); // Convertir en décimal
          perfCell.getFormat().setNumberFormat("0.00%");
        }
      }
    }
  }
}













