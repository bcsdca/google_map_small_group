function createMapGroupNorthCounty() {
  createMapForGroup("Group-NorthCounty");
}

function createMapGroupChulaVista() {
  createMapForGroup("Group-ChulaVista");
}

function createMapGroupScriptsRanch() {
  createMapForGroup("Group-ScriptsRanch");
}

function createMapGroupAll() {
  createMapForGroup("All");
}

function createMapForGroup(groupName) {
  Logger.log("create map for group: " + groupName)
  const url = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec?group=${encodeURIComponent(groupName)}`;
  Logger.log("url: " + url)
  
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial; padding: 10px;">
      <p>Click the link below to open the map for <strong>${groupName}</strong>:</p>
      <p>
        <a href="#" style="font-size: 14px; color: blue;" onclick="window.open('${url}', '_blank'); google.script.host.close(); return false;">
          Open Google Map
        </a>
      </p>
    </div>
  `).setWidth(300).setHeight(150);

  SpreadsheetApp.getUi().showModalDialog(html, `View Map - ${groupName}`);
}

