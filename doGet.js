function doGet(e) {
  const groupParam = e.parameter.group || "Group-NorthCounty";
  const groupNames = ["Group-NorthCounty", "Group-ChulaVista", "Group-ScriptsRanch"];
  const locations = [];

  const targetGroups = (groupParam.toLowerCase() === "all")
    ? groupNames
    : [groupParam];

  targetGroups.forEach(groupName => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(groupName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const [host, name, address, lat, lng] = data[i];

      if (name && address && lat && lng) {
        locations.push({
          host: host === true || host === "TRUE", // detect host flag
          name: name.toString(),
          address: address.toString(),
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          group: groupName
        });
      }
    }
  });

  const htmlTemplate = HtmlService.createTemplateFromFile("h30-elliptical");
  htmlTemplate.apiKey = MAPS_API_KEY;
  htmlTemplate.data = JSON.stringify(locations);

  return htmlTemplate.evaluate();
}


