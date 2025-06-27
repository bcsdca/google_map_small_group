function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("⛳ FNBS Small Group Planning Tool ⛳")
    .addSubMenu(
      ui.createMenu("Updating Navigation Distance and Time")
        .addItem("For NorthCounty\'s group", "runGroupNorthCounty")
        .addItem("For ChulaVista\'s group", "runGroupChulaVista")
        .addItem("For ScriptsRanch\'s group", "runGroupScriptsRanch")
    )
    .addSubMenu(
      ui.createMenu("Creating custom googNorthCounty map")
        .addItem("For NorthCounty\'s group", "createMapGroupNorthCounty")
        .addItem("For ChulaVista\'s group", "createMapGroupChulaVista")
        .addItem("For ScriptsRanch\'s group", "createMapGroupScriptsRanch")
        .addItem("For All groups", "createMapGroupAll")
    )

  .addSubMenu(
      ui.createMenu("Restore original addresses")
        .addItem("For NorthCounty\'s group", "restoreGroupNorthCounty")
        .addItem("For ChulaVista\'s group", "restoreGroupChulaVista")
        .addItem("For ScriptsRanch\'s group", "restoreGroupScriptsRanch")
    )
    .addToUi();
}
