
var desktop;

function launch(url) { window.open(url,"_blank"); }

var menu =  [
  {
    "id": "mb-import",
    "label": "Import",
    "entries": [
    ]
  },
  {
    "id": "mb-edit",
    "label": "Edit",
    "entries": [ 
       [ "Undo", undo ],
       [ "Redo", redo ],
       [ "Sort by Time", dosingSortByTime ],
       [ "Sort by Drug", dosingSortByDrug ],
/*
       [ "Start in 2min", function () {
           var d = new Date();
           d.setTime(d.getTime()+1000*2*60);
           stanpumpConfig.starttime = d.toTimeString().split(' ')[0].split(':').join('.');
           stanpumpDirty=true;
       } ],
*/
       [ "Refresh", function () { stanpumpDirty=true; } ]
    ]
  },
  {
    "id": "mb-plotters",
    "label": "Drugs",
    "entries": [ ]
  },
  {
    "id": "mb-examples",
    "label": "Examples",
    "entries": [
    ]
  },
  {
    "id": "mb-tools",
    "label": "Tools",
    "entries": [ ]
  }, {
    "id": "mb-export",
    "label": "Export",
    "entries": [
     ]
  },
  {
    "id": "mb-plugins",
    "label": "Plugins",
    "entries": [
       [ "Plugin Manager..", pluginManagerLauncher ],
       [ "Install custom plugin..", function () { mqLoadJS("*.plugin",addPlugin); } ],
    ]
  }, {
    "id": "mb-help",
    "label": "Help",
    "entries": [
      [ "MapleQuest YouTube..", function () { launch('https://www.youtube.com/@MapleQuestLabs'); } ],
      [ "MapleQuest GitHub..", function () { launch('https://github.com/maplequest?tab=repositories'); } ],
      [ "StanpumpR GitHub..", function () { launch('https://github.com/StevenLShafer/stanpumpR'); } ],
      [ "About " + mqTitle,  function () { initSplash(true); } ]
    ]
  },
];

var logTimeout;

function initConsole() {
  function makeLogWrapper (oldfun,color) {
    return function () {
      var msg = [];
      var n = arguments.length;
      for (var i=0;i<n;i++) msg.push(''+arguments[i]);
      desktop.statusbar.setColor(4,color);
      desktop.statusbar.set(4,msg.join(' '));
      if (logTimeout) clearTimeout(logTimeout);
      logTimeout = setTimeout(function () { desktop.statusbar.set(4,''); }, 20000);
      return oldfun.apply(undefined, arguments);
    }
  }
  console.log = makeLogWrapper(console.log,mqPal(0.5).hex());
  console.error = makeLogWrapper(console.error,'red');
  console.warn = makeLogWrapper(console.warn,'orange');
  console.log(mqTitle + ' ' + mqVersion);
}

function initDesktop() {
  desktop = new mqDesktop({ "mq-entries": menu });
  mqAppend(desktop.widget,mqMakeWidget({
    tag: 'img',
    src: mqVersion+'/icons/spinner.gif',
    id:  'working',
    height: '16px',
    position: 'absolute',
    right: '4',
    bottom: '4',
    display: 'none'
  }));
  mqAppend('mq-root',desktop.widget);
  desktop.statusbar.setTooltip(1,'Current simulation name');
  desktop.statusbar.setTooltip(2,'Start time and duration');
  desktop.statusbar.setTooltip(3,'Patient covariates');
  desktop.statusbar.setTooltip(4,'System log message');
  mqSet('desktop','border-top','5px solid #729f88');
}

/*
function testbootstrap () {
  var data = `{
  "filename": "TestQR",
  "weight": 60,
  "height": 168,
  "age": 50,
  "sex": "female",
  "maximum": 120,
  "drug": [
    "ketamine",
    "ketamine",
    "ketamine",
    "ketamine"
  ],
  "time": [
    0,
    3,
    14,
    60
  ],
  "dose": [
    9.01,
    17.9,
    19.2,
    0
  ],
  "units": [
    "mg",
    "mg/hr",
    "mg/hr",
    "mg/hr"
  ],
  "annotations": [],
  "starttime": "00.00.00"
}`;
  var url = "http://127.0.0.1:8000/#" + btoa(data);
  window.location = url;
}
*/

function bootstrap() {
  if (location.hash!="") {
    var hashstr = location.hash.slice(1);
    var data = null;
    try { data = JSON.parse(atob(hashstr)) } catch (e) { data=null; };
    if (data) { 
      mqStorageSetJSON('stanpump-config',data);
    } 
    window.location="https://positiva.maplequestlabs.com"
    //window.location="http://127.0.0.1:8000"
  } else {
    stanpumpConfig=mqStorageGetJSON('stanpump-config',  
{
  filename: "DemoExample",
  weight: 60,
  height: Math.round(66*2.54),
  age: 50,
  sex: "female",
  maximum: 90,
  drug: [ "propofol","fentanyl","remifentanil","rocuronium","propofol","rocuronium","rocuronium","rocuronium" ],
  time: [ 0,0,0,0,10,20,40,60 ],
  dose: [ 150,100,0.1,50,125,20,20,20 ],
  units: [ "mg","mcg","mcg/kg/min","mg","mcg/kg/min","mg","mg","mg" ]
});
    stanpumpDirty=true;
  }
}

function boot() {
  bootstrap();
  mqInit({
   "pal-scale": ['#171923','#ffffff'],
   "pal-domain": [1,0]
  });
  initDesktop();
  initSignalBase();
  initPlotters();
  initImporters();
  initExporters();
  initHover();
  initSplash();
  initExamples();
  initTools();
  initStanpump();
  initKeyboard();
  initNotifications();
  initContextMenu();
  initDosingTable();
  initPlugins();
  // wait for WebR to initialize before enabling the console interface
  setTimeout(initConsole,3000);
  // this prevents hover near edges from making window shift
  mqSet('mq-root','overflow','clip');
}

window.addEventListener( 'load', boot );

