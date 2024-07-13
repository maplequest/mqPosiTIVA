
var tools = [
];

function applyTool(idx) {
  if (tools[idx][1]()) stanpumpDirty=true;
}

function makeToolCB(idx) {
  return function () { applyTool(idx); }
}

function addTool(flt) {
  tools.push(flt);
  var idx = tools.length - 1;
  desktop.menubar.deleteSubmenu('mb-tools',flt[0]);
  desktop.menubar.addSubmenu('mb-tools',[flt[0], makeToolCB(idx)]);
  desktop.menubar.sortSubmenu('mb-tools');
}

function initTools () {
  mqAjaxJSDir(mqVersion+'/tools');
}

