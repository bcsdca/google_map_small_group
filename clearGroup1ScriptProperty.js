function clearGroup1ScriptProperty() {
  PropertiesService.getScriptProperties().deleteProperty('Group 1');
  Logger.log("Script property for 'Group 1' deleted.");
}
