
var importers = [];

function runImporter(idx) {
  importers[idx][1](); 
}

function makeImporterCB(idx) {
  return function () { runImporter(idx); }
}

function addImporter(importer) {
  importers.push(importer);
  var idx = importers.length - 1;
  desktop.menubar.deleteSubmenu('mb-import',importer[0]);
  desktop.menubar.addSubmenu('mb-import',[importer[0], makeImporterCB(idx)]);
  desktop.menubar.sortSubmenu('mb-import');
}

function initImporters () {
  mqAjaxJSDir(mqVersion+'/importers');
}

