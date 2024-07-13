
var plugins = [];

function removePlugin(name) {
  var res = [];
  for (var i=0;i<plugins.length;i++) {
    if (plugins[i]['name']!=name) res.push({
      name: plugins[i].name,
      code: plugins[i].code
    });
  }
  mqStorageSetJSON('positiva-plugins',res);
  plugins=res;
}

function removePluginOtherVersions(name) {
  if (!name.includes('-mq.plugin')) return;
  var filter = name.split('-').slice(0,2).join('-')+'-*.*.*-mq.plugin';
  var rgx = new RegExp(filter);
  var res = [];
  for (var i=0;i<plugins.length;i++) {
    if (plugins[i]['name'].match(rgx)==null) res.push({
      name: plugins[i].name,
      code: plugins[i].code
    }); // else console.log('Removed ' + plugins[i]['name']);
  }
  mqStorageSetJSON('positiva-plugins',res);
  plugins=res;
}

function addPlugin(name,code) {
  removePluginOtherVersions(name);
  plugins.push({name: name, code: code});
  mqStorageSetJSON('positiva-plugins',plugins);
  mqDialogOK({
     title: 'Plugin Installed',
     label: name + ' has been installed. You can uninstall it later from the Plugin Manager.',
    });
}

function removePluginAsk(name) {
  mqDialogOK( {
    title: 'Confirm Plugin Removal',
    label: 'Click OK to confirm removal of ' + name +'. This action cannot be undone.',
    onclick: function () { removePlugin(name); }
  });
}

function initPlugins() {
  plugins = mqStorageGetJSON('positiva-plugins',[]);
  for (var i=0;i<plugins.length;i++) {
    try { eval(plugins[i].code); } catch (e) { console.log(e.message); } 
  }
}

function clearPlugins() {
  mqStorageSetJSON('positiva-plugins',[]);
  plugins=[];
}

function clearPluginsAsk() {
}

