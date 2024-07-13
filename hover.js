
var hover;
var hoverCtx;
var hoverAt=null;
var hoverAtValue=null;
var hoverAtValueLast=null;
var hoverHide = 0;
var hoverAtTime;
var hoverAtLast;
var hoverX=0;
var hoverY=0;
var hoverInvert=null;
var hoverPlot=null;
var hoverAnnotation = null;
var hoverAnnotationLabel = "";

var hoverW = 224;
var hoverH = 55;

function clamp(v, vmin, vmax) { 
  if (v > vmax) { v = vmax; };
  return v < vmin ? vmin : v; 
};

function hoverFindAnnotation () {
  hoverAnnotation=null;
  hoverAnnotationLabel="";
  var mindist = 0.001;
  var rge = signalbase.zoomEnd - signalbase.zoomBegin;
  if (stanpumpConfig.eventtimes&&stanpumpConfig.eventnames) {
    for (var i=0;i<stanpumpConfig.eventtimes.length;i++) {
      var anntime = 60*stanpumpConfig.eventtimes[i];
      if (anntime>=signalbase.zoomBegin&&anntime<=signalbase.zoomEnd) {
        var dist = Math.abs(hoverAt - anntime)/rge;
        if (dist<mindist) {
          hoverAnnotation = dist;
          hoverAnnotationLabel=stanpumpConfig.eventnames[i];
          mindist = dist;
        }
      }
    }
  }
  if (stanpumpConfig.annotations) {
    for (var i=0;i<stanpumpConfig.annotations.length;i++) {
      var anntime = 60*stanpumpConfig.annotations[i][0];
      if (anntime>=signalbase.zoomBegin&&anntime<=signalbase.zoomEnd) {
        var dist = Math.abs(hoverAt - anntime)/rge;
        if (dist<mindist) {
          hoverAnnotation = dist;
          hoverAnnotationLabel=stanpumpConfig.annotations[i][1];
          mindist = dist;
        }
      }
    }
  }
}

function hoverDeleteAnnotation () {
  var rge = signalbase.zoomEnd - signalbase.zoomBegin;
  if (stanpumpConfig.eventtimes&&stanpumpConfig.eventnames) {
    for (var i=0;i<stanpumpConfig.eventtimes.length;i++) {
      var anntime = 60*stanpumpConfig.eventtimes[i];
      if (anntime>=signalbase.zoomBegin&&anntime<=signalbase.zoomEnd) {
        var dist = Math.abs(hoverAt - anntime)/rge;
        if (dist==hoverAnnotation) {
          undoBegin();
          stanpumpConfig.eventtimes.splice(i,1);                  
          stanpumpConfig.eventnames.splice(i,1);       
          undoEnd();           
        }
      }
    }
  }
  if (stanpumpConfig.annotations) {
    for (var i=0;i<stanpumpConfig.annotations.length;i++) {
      var anntime = 60*stanpumpConfig.annotations[i][0];
      if (anntime>=signalbase.zoomBegin&&anntime<=signalbase.zoomEnd) {
        var dist = Math.abs(hoverAt - anntime)/rge;
        if (dist==hoverAnnotation) {
          undoBegin();
          stanpumpConfig.annotations.splice(i,1);
          undoEnd();
        }
      }
    }
  }
}

function hoverChangeAnnotation (str) {
  var rge = signalbase.zoomEnd - signalbase.zoomBegin;
  if (stanpumpConfig.eventtimes&&stanpumpConfig.eventnames) {
    for (var i=0;i<stanpumpConfig.eventtimes.length;i++) {
      var anntime = 60*stanpumpConfig.eventtimes[i];
      if (anntime>=signalbase.zoomBegin&&anntime<=signalbase.zoomEnd) {
        var dist = Math.abs(hoverAt - anntime)/rge;
        if (dist==hoverAnnotation) {
          if (eventDefaults['Event'].includes(str)) {
            undoBegin();
            stanpumpConfig.eventnames[i][1]=str;
            undoEnd();
          } else {
            console.warn('Invalid StanpumpR event');
          }
        }
      }
    }
  }
  if (stanpumpConfig.annotations) {
    for (var i=0;i<stanpumpConfig.annotations.length;i++) {
      var anntime = 60*stanpumpConfig.annotations[i][0];
      if (anntime>=signalbase.zoomBegin&&anntime<=signalbase.zoomEnd) {
        var dist = Math.abs(hoverAt - anntime)/rge;
        if (dist==hoverAnnotation) {
          undoBegin();
          stanpumpConfig.annotations[i][1]=str;
          undoEnd();
        }
      }
    }
  }
}

function hoverAddAnnotation (str,time) {
  time = Math.round(time/60);
  undoBegin();
  if  (eventDefaults['Event'].includes(str)) {
    if (stanpumpConfig.eventtimes==null) {
       stanpumpConfig.eventtimes=[time];
    } else {
       stanpumpConfig.eventtimes.push(time);
    }
    if (stanpumpConfig.eventnames==null) { 
       stanpumpConfig.eventnames=[str];
    } else {
      stanpumpConfig.eventnames.push(str);
    }
  } else {
    if (stanpumpConfig.annotations==null) {
      stanpumpConfig.annotations=[[time,str]];
    } else {
      stanpumpConfig.annotations.push([time,str]);
    }
  }
  undoEnd();
}


function hoverValid() {
  var valid=false;
  for (var i=0;i<plots.length;i++) if (plots[i].hoverValid) valid=true;
  return valid;
}

function hoverLoop() {
   if (!hoverValid()||hoverAt === null) { 
     mqSet('hover-plot','display','none');
     for (var i=0;i<plots.length;i++) plots[i].hover(0);
   } else { 
     if (hoverAt!=hoverAtLast||hoverAtValue!=hoverAtValueLast) { 
       if (hoverPlot) {
         if (mqElement('hover-label')) {
           hoverFindAnnotation();
           mqElement('hover-label').value = hoverAnnotationLabel;
           mqElement('hover-label').focus(); 
           if (hoverAt!=hoverAtLast) mqElement('hover-label').select();
         }
         var render = hoverPlot.config['renderHover'];
         if (render) render();
         mqSet('hover-plot','display','block');
         mqSet('hover-plot','left', (hoverX - hoverW/2.0) + 'px');
         mqSet('hover-plot','top', (hoverY + 30) + 'px');
         var pos=0;
         if (hoverAt<signalbase.zoomBegin) pos=0;
           else if (hoverAt>signalbase.zoomEnd) pos=1;
             else pos = (hoverAt - signalbase.zoomBegin)/(signalbase.zoomEnd-signalbase.zoomBegin);
         for (var i=0;i<plots.length;i++) plots[i].hover(pos);
         hoverAtLast = hoverAt; 
         hoverAtValueLast = hoverAtValue; 
       }
     } 
   } 
   setTimeout(hoverLoop, 100); 
}

function initHover() {
  hover = mqMakeWidget({
    tag: 'div',
    "id": "hover-plot",
    "position": "absolute",
    "top": "0",
    "left": "0",
    "display": "none",
    "background": "white",
    "border": "1px solid white",
    "opacity": "0.75",
    "padding-bottom": "3px"
  });
  var hoverCanvas = mqMakeWidget({
    tag: 'canvas',
    "id": "hover-canvas",
    "margin": "0px"
  });
  mqAttr(hoverCanvas,'width', hoverW + '');
  mqAttr(hoverCanvas,'height', hoverH + '');
  mqAppend(hover,hoverCanvas);

  if (!mqHasTouch()) {
  var hoverForm = mqMakeWidget({
    tag: 'form',
    "id": "hover-form",
    "margin-top": "3px",
    "position": "relative"
  });
  var hoverInput = mqMakeWidget({
    tag: 'input',
    "id": "hover-label",
    "position": "absolute",
    "top": "-2px",
    "font-size": "14px", 
    "font-color": "black",
    "text-align": "center",
    "type": "text",
    "placeholder": "<Type to Annotate>",
    "outline": "0",
    "border": "0",
  });
  mqStyle(hoverInput,'width','100%');
  mqAppend(hoverForm,hoverInput);
  mqAppend(hover,hoverForm);
  mqEvent(hoverForm,'submit',function (e) { e.preventDefault(); });
  mqEvent(hoverInput,'keyup', function (e) {
    e.preventDefault();
    if (e.key === 'Enter') {
      var str = mqElement('hover-label').value;
      if (str.length>0) {
        if (hoverAnnotation!=null) {
          hoverChangeAnnotation(str);
        } else {
          hoverAddAnnotation(str,hoverAt);
        }
      } else { 
         if (hoverAnnotation!=null) {
           hoverDeleteAnnotation();
         }
      }
      mqElement('hover-label').value = '';
      hoverAt=null;
    }
  });
  }

  mqAppend(hover);
  hoverCtx = hoverCanvas.getContext('2d');

  hoverLoop();
}


