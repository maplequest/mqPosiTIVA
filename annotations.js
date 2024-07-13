
var annotationAt = null;
var annotationDist = null;
var annotationLabel = null;

function annotationUI (lbl,cb,def="") {
  mqDelete('annotation-window');
  var h = 64;
  var w = 2*120 + 3*8;
  var x,y;
  var wnd = mqWindow({
    id: 'annotation',
    title: lbl,
    width: w+'px', height: h+'px',
    onclose: function () { }
  });
  x=8;
  y=32;
  mqAppend(wnd,mqInput({
    id: 'annotation-text',
    x: x+'px',
    y: y+'px',
    width: (w-16)+'px',
    value: def,
    onenter: function () {
      cb();
      mqDelete('annotation-window');
    }
  }));
  mqElement('annotation-text').focus()
}

function addAnnotationUI() {
  if (annotationDist!=null) editAnnotationUI();
  annotationUI("Add Annotation",function () {
    var txt = mqGet('annotation-text','innerText');
    if (txt=="") return;
    if (eventDefaults.Event.includes(txt)) {
      if (stanpumpConfig.eventtimes==null) {
        stanpumpConfig.eventtimes=[contextAt/60];
        stanpumpConfig.eventnames=[txt];
      } else {
        stanpumpConfig.eventtimes.push(contextAt/60);
        stanpumpConfig.eventnames.push(txt);
      }
    } else {
      if (stanpumpConfig.annotations==null)
        stanpumpConfig.annotations=[[contextAt/60,txt]];
      else
        stanpumpConfig.annotations.push([contextAt/60,txt]);
    }
    stanpumpDirty=true;
  });
}

function removeAnnotation () {
  hoverDeleteAnnotation()
}


