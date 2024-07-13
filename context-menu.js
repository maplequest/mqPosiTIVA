
var contextX = 0;
var contextY = 0;
var contextAt = 0;
var contextDrug="";

var contextmenu = [
  [ "Add dose.." , function () {
    dosingEntry=null;
    dosingEntryUI();
    mqSet('dosing-entry-time','innerHTML',(contextAt/60).toFixed(1));
  } ],
  [ "Remove DRUG dose" , function () { removeDrugNear(contextDrug,contextAt/60); } ],
  [ "Delete DRUG" , function () { deleteDrug(contextDrug); } ],
  [ "Add annotation.." , addAnnotationUI ],
  [ "Remove annotation" , function () { removeEventOrAnnotationNear(contextAt/60); } ],
  [ "Dose Table..", dosingUI ],
/*
  [ "Set as wall time" , function () {
     var d = new Date();
     d.setTime(d.getTime()-1000*contextAt);
     stanpumpConfig.starttime = d.toTimeString().split(' ')[0].split(':').join('.'); 
     stanpumpDirty=true;
   } ],
*/
];

function contextMenuUI () {
  if (!hoverValid()) return;
  var id = 'contextmenu';
  mqDelete(id+'-dropdown');
  contextX=hoverX;
  contextY=hoverY;
  contextAt=hoverAt;
  contextDrug=hoverPlot.id.slice(8);
  var x=hoverX;
  var y=hoverY;
  hoverHide=1;
  var content = mqMakeWidget({
    "tag": 'div',
    "id": id + '-dropdown',
    "position": "absolute",
    "top": (y-0) + 'px',
    "left": (x-0) + 'px',
    "z-index": "100",
    "min-width": "150px",
    "max-height": "350px",
    "overflow-x": "hidden",
    "overflow-y": "auto",
    "white-space": "nowrap",
    "background": mqPal(0.1).hex(),
    "class": "mq-dropdown",
    "box-shadow": "0px 2px 4px 0px " + mqPal(1.0).hex()
  });
  function makeSetter(i) {
    return function () { 
      contextmenu[i][1]();
      hoverHide=0;
    }
  }
  for (var i=0;i<contextmenu.length;i++) {
    var o = mqMakeWidget({
      "tag": 'div',
      "id": id + '-dropdown-' + i,
      "float": "none",
      "text-decoration": "none",
      "text-align": "left",
      "width": "calc(100% - 7px)",
      "padding-left": "5px",
      "class": "mq-menubar-hover",
      "border": "1px solid transparent",
      "user-select": "none",
      "innerHTML": contextmenu[i][0].replace("DRUG",contextDrug),
      "cursor": "pointer",
      "onclick": makeSetter(i)
    });
    mqAppend(content,o);
  }
  mqAppend('mq-root',content);
  var w = mqWidth(content);
  var w0 = window.innerWidth;
  if (x+w>w0) mqSet(content,'left',(w0-w)+'px');
  var h = mqHeight(content);
  var h0 = window.innerHeight;
  if (y+h>h0) mqSet(content,'top',(h0-h)+'px');
  hoverFindAnnotation();
  annotationAt = hoverAt;
  annotationDist = hoverAnnotation;
  annotationLabel = hoverAnnotationLabel; 
}


function initContextMenu () {
  if (document.addEventListener) {
    document.addEventListener('contextmenu', function(e) {
   //   contextMenuUI();
      e.preventDefault();
    }, false);
  } else {
    document.attachEvent('oncontextmenu', function() {
   //   contextMenuUI();
      window.event.returnValue = false;
    });
  }
 // mqCSS('context-menu','html { -webkit-touch-callout: default; }');
}

