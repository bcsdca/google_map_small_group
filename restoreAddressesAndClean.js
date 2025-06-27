function restoreGroupNorthCounty() {
  restoreAddressesAndClean("Group-NorthCounty")
}

function restoreGroupChulaVista() {
  restoreAddressesAndClean("Group-ChulaVista")
}

function restoreGroupScriptsRanch() {
  restoreAddressesAndClean("Group-ScriptsRanch")
}

function restoreAddressesAndClean(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const props = PropertiesService.getScriptProperties();

  if (!sheet) {
    Logger.log(`Sheet ${sheetName} not found.`);
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const hostCol = headers.indexOf("Host \nFamily");
  const nameCol = headers.indexOf("Name");
  const addressCol = headers.indexOf("Address");
  const latCol = headers.indexOf("Latitude");
  const longCol = headers.indexOf("Longitude");
  const distanceCol = headers.indexOf("Navigation Distance \n(miles)");
  const timeCol = headers.indexOf("Navigation Time \n(minutes)");


  if (hostCol === -1 || nameCol === -1) {
    Logger.log("Missing required 'Host Family' or 'Name' columns.");
    return;
  }

  const groupDataRaw = props.getProperty(sheetName);
  if (!groupDataRaw) {
    Logger.log(`No saved address data for group key: ${sheetName}`);
    return;
  }

  const groupData = JSON.parse(groupDataRaw);

  for (let i = 1; i < data.length; i++) {
    const name = data[i][nameCol];
    const savedEntry = groupData.find(entry => entry.name === name);

    if (savedEntry) {
      sheet.getRange(i + 1, addressCol + 1).setValue(savedEntry.address);
    } else {
      Logger.log(`No saved address found for name: ${name}`);
    }

    // Clear Lat, Long, Distance, Time if columns exist
    if (latCol !== -1) sheet.getRange(i + 1, latCol + 1).clearContent();
    if (longCol !== -1) sheet.getRange(i + 1, longCol + 1).clearContent();
    if (distanceCol !== -1) sheet.getRange(i + 1, distanceCol + 1).clearContent();
    if (timeCol !== -1) sheet.getRange(i + 1, timeCol + 1).clearContent();
  }

  Logger.log("Original addresses restored for sheet: " + sheetName);
}
