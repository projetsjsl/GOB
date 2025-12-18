Attribute VB_Name = "UpdateIndices"
' Macro VBA pour mettre à jour les données sectorielles depuis l'API web
' Nécessite la bibliothèque VBA-JSON (JsonConverter.bas)
'
' Instructions d'installation:
' 1. Importer ce module dans Excel (Alt+F11 > Insert > Module)
' 2. Importer JsonConverter.bas (téléchargeable depuis https://github.com/VBA-tools/VBA-JSON)
' 3. Ajouter la référence "Microsoft XML, v6.0" (Tools > References)
' 4. Exécuter la macro depuis l'onglet Parameters ou via Alt+F8

Option Explicit

' URL de base du serveur web (à modifier selon votre configuration)
Const SERVER_URL As String = "http://localhost:5000"
Const API_SECTOR_ENDPOINT As String = "/api/sector"
Const API_INDEX_ENDPOINT As String = "/api/index"

' Noms des onglets
Const SHEET_PARAMETERS As String = "Parameters"
Const SHEET_RAW_DATA As String = "RawData_SP500"
Const SHEET_CURRENT As String = "Current_SP500"

' ==================== FONCTION PRINCIPALE ====================

Sub UpdateIndices()
    On Error GoTo ErrorHandler
    
    Dim wsParameters As Worksheet
    Dim wsRawData As Worksheet
    Dim wsCurrent As Worksheet
    
    ' Vérifier que les onglets existent
    Set wsParameters = ThisWorkbook.Worksheets(SHEET_PARAMETERS)
    Set wsRawData = ThisWorkbook.Worksheets(SHEET_RAW_DATA)
    Set wsCurrent = ThisWorkbook.Worksheets(SHEET_CURRENT)
    
    ' Récupérer l'URL du serveur depuis Parameters (cellule B1)
    Dim serverUrl As String
    serverUrl = wsParameters.Range("B1").Value
    If serverUrl = "" Then serverUrl = SERVER_URL
    
    ' Récupérer l'horizon sélectionné (cellule B3)
    Dim horizon As String
    horizon = wsParameters.Range("B3").Value
    If horizon = "" Then horizon = "B"
    
    Application.ScreenUpdating = False
    Application.DisplayAlerts = False
    
    ' Appeler l'API /api/sector
    Dim jsonResponse As String
    jsonResponse = CallAPI(serverUrl & API_SECTOR_ENDPOINT)
    
    If jsonResponse = "" Then
        MsgBox "Erreur: Impossible de récupérer les données du serveur.", vbCritical
        GoTo Cleanup
    End If
    
    ' Parser le JSON
    Dim json As Object
    Set json = JsonConverter.ParseJson(jsonResponse)
    
    ' Vérifier le succès
    If Not json("success") Then
        MsgBox "Erreur API: " & json("error"), vbCritical
        GoTo Cleanup
    End If
    
    Dim sectorData As Object
    Set sectorData = json("data")
    
    ' Mettre à jour RawData_SP500
    UpdateRawData wsRawData, sectorData
    
    ' Mettre à jour Current_SP500
    UpdateCurrentData wsCurrent, sectorData
    
    ' Mettre à jour la date dans Parameters
    wsParameters.Range("B2").Value = Now()
    
    MsgBox "Données mises à jour avec succès!", vbInformation
    
Cleanup:
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True
    Exit Sub
    
ErrorHandler:
    MsgBox "Erreur lors de la mise à jour: " & Err.Description, vbCritical
    GoTo Cleanup
End Sub

' ==================== FONCTIONS UTILITAIRES ====================

' Appelle l'API web et retourne la réponse JSON
Function CallAPI(url As String) As String
    On Error GoTo ErrorHandler
    
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    http.Open "GET", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.send
    
    If http.Status = 200 Then
        CallAPI = http.responseText
    Else
        CallAPI = ""
        MsgBox "Erreur HTTP " & http.Status & ": " & http.statusText, vbCritical
    End If
    
    Exit Function
    
ErrorHandler:
    CallAPI = ""
    MsgBox "Erreur lors de l'appel API: " & Err.Description, vbCritical
End Function

' Met à jour l'onglet RawData_SP500 avec toutes les données
Sub UpdateRawData(ws As Worksheet, sectorData As Object)
    Dim row As Long
    row = 2 ' Commencer à la ligne 2 (ligne 1 = en-têtes)
    
    ' Effacer les anciennes données (garder les en-têtes)
    ws.Range("A2:C1000").ClearContents
    
    ' Parcourir tous les rangs (Rank A à Rank J)
    Dim rankKey As String
    Dim rankLetter As String
    Dim i As Integer
    
    For i = 1 To 10 ' A à J
        rankLetter = Chr(64 + i) ' A=65, B=66, etc.
        rankKey = "Rank " & rankLetter & ": Real-Time Performance"
        
        ' Vérifier si cette clé existe dans les données
        If Not sectorData(rankKey) Is Nothing Then
            Dim rankData As Object
            Set rankData = sectorData(rankKey)
            
            ' Parcourir tous les secteurs
            Dim sectorName As Variant
            For Each sectorName In rankData.Keys
                ws.Cells(row, 1).Value = rankKey
                ws.Cells(row, 2).Value = sectorName
                ws.Cells(row, 3).Value = rankData(sectorName)
                ws.Cells(row, 3).NumberFormat = "0.00%"
                row = row + 1
            Next sectorName
        End If
    Next i
End Sub

' Met à jour l'onglet Current_SP500 avec la matrice secteurs x horizons
Sub UpdateCurrentData(ws As Worksheet, sectorData As Object)
    ' Effacer les données existantes
    ws.Range("B2:K100").ClearContents
    
    ' Récupérer la liste unique des secteurs
    Dim sectors As Collection
    Set sectors = New Collection
    Dim rankKey As String
    Dim rankLetter As String
    Dim i As Integer
    Dim sectorName As Variant
    
    ' Parcourir Rank A pour obtenir la liste des secteurs
    rankKey = "Rank A: Real-Time Performance"
    If Not sectorData(rankKey) Is Nothing Then
        Dim rankAData As Object
        Set rankAData = sectorData(rankKey)
        
        For Each sectorName In rankAData.Keys
            On Error Resume Next
            sectors.Add sectorName, sectorName
            On Error GoTo 0
        Next sectorName
    End If
    
    ' Remplir les secteurs en colonne A (à partir de la ligne 2)
    Dim row As Long
    row = 2
    For Each sectorName In sectors
        ws.Cells(row, 1).Value = sectorName
        row = row + 1
    Next sectorName
    
    ' Remplir les performances par horizon (colonnes B à K)
    Dim col As Integer
    For i = 1 To 10 ' A à J
        rankLetter = Chr(64 + i)
        rankKey = "Rank " & rankLetter & ": Real-Time Performance"
        col = i + 1 ' Colonne B = 2, C = 3, etc.
        
        ' En-tête de colonne
        ws.Cells(1, col).Value = rankKey
        
        If Not sectorData(rankKey) Is Nothing Then
            Dim rankData As Object
            Set rankData = sectorData(rankKey)
            
            row = 2
            For Each sectorName In sectors
                If rankData.Exists(sectorName) Then
                    ws.Cells(row, col).Value = rankData(sectorName) / 100 ' Convertir en décimal
                    ws.Cells(row, col).NumberFormat = "0.00%"
                End If
                row = row + 1
            Next sectorName
        End If
    Next i
End Sub

















