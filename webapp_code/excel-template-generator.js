/**
 * Script Node.js pour générer un template Excel avec la structure de base
 * Nécessite: npm install exceljs
 * 
 * Usage: node excel-template-generator.js
 */

import ExcelJS from 'exceljs';

async function generateExcelTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // ==================== ONGLET PARAMETERS ====================
  const wsParameters = workbook.addWorksheet('Parameters');
  
  wsParameters.getCell('A1').value = 'URL Serveur:';
  wsParameters.getCell('B1').value = 'http://localhost:5000';
  wsParameters.getCell('A2').value = 'Dernière mise à jour:';
  wsParameters.getCell('B2').value = new Date();
  wsParameters.getCell('B2').numFmt = 'dd/mm/yyyy hh:mm:ss';
  wsParameters.getCell('A3').value = 'Horizon:';
  wsParameters.getCell('B3').value = 'B';
  
  // Validation de données pour la liste déroulante (à faire manuellement dans Excel)
  wsParameters.getCell('A4').value = 'Instructions:';
  wsParameters.getCell('B4').value = '1. Excel Desktop : Cliquer sur le bouton "Mettre à jour" ou exécuter la macro UpdateIndices (Alt+F8)\n2. Excel Online : Aller dans Automatisation > Scripts > UpdateIndicesScript > Exécuter\n3. Vérifier que l\'URL du serveur (B1) est correcte\n4. Sélectionner l\'horizon souhaité (B3)';
  wsParameters.getCell('B4').alignment = { wrapText: true };
  
  // ==================== ONGLET RAWDATA_SP500 ====================
  const wsRawData = workbook.addWorksheet('RawData_SP500');
  
  wsRawData.getCell('A1').value = 'Timeframe';
  wsRawData.getCell('B1').value = 'Sector';
  wsRawData.getCell('C1').value = 'Performance';
  
  // En-têtes en gras
  ['A1', 'B1', 'C1'].forEach(cell => {
    wsRawData.getCell(cell).font = { bold: true };
    wsRawData.getCell(cell).alignment = { horizontal: 'center' };
  });
  
  // ==================== ONGLET CURRENT_SP500 ====================
  const wsCurrent = workbook.addWorksheet('Current_SP500');
  
  // En-têtes des horizons (Rank A à Rank J)
  const horizons = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  wsCurrent.getCell('A1').value = 'Sector';
  wsCurrent.getCell('A1').font = { bold: true };
  wsCurrent.getCell('A1').alignment = { horizontal: 'center' };
  
  horizons.forEach((letter, index) => {
    const col = String.fromCharCode(66 + index); // B, C, D, ...
    wsCurrent.getCell(`${col}1`).value = `Rank ${letter}: Real-Time Performance`;
    wsCurrent.getCell(`${col}1`).font = { bold: true };
    wsCurrent.getCell(`${col}1`).alignment = { horizontal: 'center' };
  });
  
  // ==================== ONGLET MSCI_WORLD ====================
  const wsMSCI = workbook.addWorksheet('MSCI_World');
  
  wsMSCI.getCell('A1').value = 'Secteur';
  wsMSCI.getCell('B1').value = 'Pondération (%)';
  wsMSCI.getCell('C1').value = 'Performance';
  wsMSCI.getCell('D1').value = 'Contribution';
  
  ['A1', 'B1', 'C1', 'D1'].forEach(cell => {
    wsMSCI.getCell(cell).font = { bold: true };
    wsMSCI.getCell(cell).alignment = { horizontal: 'center' };
  });
  
  const msciWeights = [
    ['Technologie de l\'information', 26.9],
    ['Financiers', 16.7],
    ['Industriels', 11.4],
    ['Consommation discrétionnaire', 10.1],
    ['Santé', 9.12],
    ['Services de communication', 8.48],
    ['Consommation courante', 5.75],
    ['Énergie', 3.52],
    ['Matériaux', 3.15],
    ['Services publics', 2.65],
    ['Immobilier', 1.97]
  ];
  
  msciWeights.forEach((row, index) => {
    const rowNum = index + 2;
    wsMSCI.getCell(`A${rowNum}`).value = row[0];
    wsMSCI.getCell(`B${rowNum}`).value = row[1];
    
    // Formule pour Performance (à adapter selon la structure réelle)
    wsMSCI.getCell(`C${rowNum}`).formula = `=IFERROR(INDEX(Current_SP500!$B$2:$K$100, MATCH(A${rowNum}, Current_SP500!$A$2:$A$100, 0), MATCH("Rank " & Parameters!$B$3 & ": Real-Time Performance", Current_SP500!$1:$1, 0)), 0)`;
    
    // Formule pour Contribution
    wsMSCI.getCell(`D${rowNum}`).formula = `=B${rowNum}/100 * C${rowNum}`;
    wsMSCI.getCell(`D${rowNum}`).numFmt = '0.00%';
  });
  
  // Total
  wsMSCI.getCell('A13').value = 'TOTAL';
  wsMSCI.getCell('A13').font = { bold: true };
  wsMSCI.getCell('B13').formula = '=SUM(B2:B12)';
  wsMSCI.getCell('D13').formula = '=SUM(D2:D12)';
  wsMSCI.getCell('D13').font = { bold: true };
  wsMSCI.getCell('D13').numFmt = '0.00%';
  
  // ==================== ONGLET SPTSX ====================
  const wsSPTSX = workbook.addWorksheet('SPTSX');
  
  wsSPTSX.getCell('A1').value = 'Secteur';
  wsSPTSX.getCell('B1').value = 'Pondération (%)';
  wsSPTSX.getCell('C1').value = 'Performance';
  wsSPTSX.getCell('D1').value = 'Contribution';
  
  ['A1', 'B1', 'C1', 'D1'].forEach(cell => {
    wsSPTSX.getCell(cell).font = { bold: true };
    wsSPTSX.getCell(cell).alignment = { horizontal: 'center' };
  });
  
  const sptsxWeights = [
    ['Financiers', 33.0],
    ['Énergie', 17.1],
    ['Industriels', 12.6],
    ['Technologie de l\'information', 10.1],
    ['Matériaux', 11.4],
    ['Consommation courante', 4.0],
    ['Consommation discrétionnaire', 3.3],
    ['Services de communication', 2.4],
    ['Immobilier', 2.0],
    ['Services publics', 3.8],
    ['Santé', 0.3]
  ];
  
  sptsxWeights.forEach((row, index) => {
    const rowNum = index + 2;
    wsSPTSX.getCell(`A${rowNum}`).value = row[0];
    wsSPTSX.getCell(`B${rowNum}`).value = row[1];
    
    // Formule pour Performance
    wsSPTSX.getCell(`C${rowNum}`).formula = `=IFERROR(INDEX(Current_SP500!$B$2:$K$100, MATCH(A${rowNum}, Current_SP500!$A$2:$A$100, 0), MATCH("Rank " & Parameters!$B$3 & ": Real-Time Performance", Current_SP500!$1:$1, 0)), 0)`;
    
    // Formule pour Contribution
    wsSPTSX.getCell(`D${rowNum}`).formula = `=B${rowNum}/100 * C${rowNum}`;
    wsSPTSX.getCell(`D${rowNum}`).numFmt = '0.00%';
  });
  
  // Total
  wsSPTSX.getCell('A13').value = 'TOTAL';
  wsSPTSX.getCell('A13').font = { bold: true };
  wsSPTSX.getCell('B13').formula = '=SUM(B2:B12)';
  wsSPTSX.getCell('D13').formula = '=SUM(D2:D12)';
  wsSPTSX.getCell('D13').font = { bold: true };
  wsSPTSX.getCell('D13').numFmt = '0.00%';
  
  // ==================== ONGLET WEIGHTED_PERFORMANCE ====================
  const wsWeighted = workbook.addWorksheet('Weighted_Performance');
  
  wsWeighted.getCell('A1').value = 'Indice';
  wsWeighted.getCell('B1').value = 'Performance Pondérée';
  wsWeighted.getCell('C1').value = 'Date de Calcul';
  
  ['A1', 'B1', 'C1'].forEach(cell => {
    wsWeighted.getCell(cell).font = { bold: true };
    wsWeighted.getCell(cell).alignment = { horizontal: 'center' };
  });
  
  wsWeighted.getCell('A2').value = 'S&P 500';
  wsWeighted.getCell('B2').formula = '=AVERAGE(Current_SP500!B2:B11)';
  wsWeighted.getCell('B2').numFmt = '0.00%';
  wsWeighted.getCell('C2').formula = '=NOW()';
  wsWeighted.getCell('C2').numFmt = 'dd/mm/yyyy hh:mm:ss';
  
  wsWeighted.getCell('A3').value = 'MSCI World';
  wsWeighted.getCell('B3').formula = '=MSCI_World!D13';
  wsWeighted.getCell('B3').numFmt = '0.00%';
  wsWeighted.getCell('C3').formula = '=NOW()';
  wsWeighted.getCell('C3').numFmt = 'dd/mm/yyyy hh:mm:ss';
  
  wsWeighted.getCell('A4').value = 'S&P/TSX';
  wsWeighted.getCell('B4').formula = '=SPTSX!D13';
  wsWeighted.getCell('B4').numFmt = '0.00%';
  wsWeighted.getCell('C4').formula = '=NOW()';
  wsWeighted.getCell('C4').numFmt = 'dd/mm/yyyy hh:mm:ss';
  
  // ==================== ONGLET DASHBOARD ====================
  const wsDashboard = workbook.addWorksheet('Dashboard');
  
  wsDashboard.getCell('A1').value = 'Indice';
  wsDashboard.getCell('B1').value = 'Performance';
  wsDashboard.getCell('C1').value = 'Horizon';
  
  ['A1', 'B1', 'C1'].forEach(cell => {
    wsDashboard.getCell(cell).font = { bold: true };
    wsDashboard.getCell(cell).alignment = { horizontal: 'center' };
  });
  
  wsDashboard.getCell('A2').value = 'S&P 500';
  wsDashboard.getCell('B2').formula = '=Weighted_Performance!B2';
  wsDashboard.getCell('B2').numFmt = '0.00%';
  wsDashboard.getCell('C2').formula = '=Parameters!B3';
  
  wsDashboard.getCell('A3').value = 'MSCI World';
  wsDashboard.getCell('B3').formula = '=Weighted_Performance!B3';
  wsDashboard.getCell('B3').numFmt = '0.00%';
  wsDashboard.getCell('C3').formula = '=Parameters!B3';
  
  wsDashboard.getCell('A4').value = 'S&P/TSX';
  wsDashboard.getCell('B4').formula = '=Weighted_Performance!B4';
  wsDashboard.getCell('B4').numFmt = '0.00%';
  wsDashboard.getCell('C4').formula = '=Parameters!B3';
  
  // Sauvegarder
  const filename = 'Index_Sector_Dashboard_Template.xlsx';
  await workbook.xlsx.writeFile(filename);
  console.log(`✅ Template Excel créé: ${filename}`);
  console.log('📝 Note: Vous devrez ajouter manuellement:');
  console.log('   - La validation de données pour Parameters!B3 (liste déroulante)');
  console.log('   - Le bouton pour la macro (Excel Desktop)');
  console.log('   - Le graphique dans Dashboard');
}

generateExcelTemplate().catch(console.error);


