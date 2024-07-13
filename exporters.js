
var exporters = [];

function runExporter(idx) {
  if (exporters[idx]&&exporters[idx][1]) exporters[idx][1](); 
}

function makeExporterCB(idx) {
  return function () { runExporter(idx); }
}

function addExporter(exporter) {
  exporters.push(exporter);
  var idx = exporters.length - 1;
  desktop.menubar.deleteSubmenu('mb-export',exporter[0]);
  desktop.menubar.addSubmenu('mb-export',[exporter[0], makeExporterCB(idx)]);
  desktop.menubar.sortSubmenu('mb-export');
}

function initExporters() {
  mqAjaxJSDir(mqVersion+'/exporters');
}

