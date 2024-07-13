
var examples = [];

function runExample(name) {
  var i;
  for (i=0;i<examples.length;i++) {
    if (examples[i][0]==name) break;
  }
  undoBegin();
  stanpumpConfig=JSON.parse(examples[i][1]); 
  undoEnd();
}

function addExample (ex) {
  examples.push(ex);
  desktop.menubar.deleteSubmenu('mb-examples',ex[0]);
  desktop.menubar.addSubmenu('mb-examples', [ex[0], function () { runExample(ex[0]); }]);
  desktop.menubar.sortSubmenu('mb-examples');
}

function initExamples() {
  mqAjaxJSDir(mqVersion+'/examples',function () { });
}

