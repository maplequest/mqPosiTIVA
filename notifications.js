
var realtimeNotifications=false;

var dismissedNotifications=[];

var alarmSounds = [
   new Audio(mqVersion+"/sounds/alarm1.ogg"),
   new Audio(mqVersion+"/sounds/alarm2.ogg"),
   new Audio(mqVersion+"/sounds/alarm3.ogg"),
   new Audio(mqVersion+"/sounds/alarm4.ogg")
  ];

function clearNotifications () {
  var objs = mqElementsOfClass('notification');
  if (objs) for (var i=0;i<objs.length;i++) mqDelete(objs[i]);
  dismissedNotifications=[];
}

function repositionNotifications () {
  for (var i=0;i<plots.length;i++) {
    var id=plots[i].id.slice(8)+'-notification-window';
    var obj = mqElement(id);
    if (obj) {
      var w = mqWidth(obj);
      var h = mqHeight(obj);
      var yc = Math.round(31+(i+0.5)*(window.innerHeight-31-26)/plots.length);
      var xc = window.innerWidth/2;
      yc+=2*Math.random()-1;
      mqSet(obj,'left',(xc-w/2)+'px');
      mqSet(obj,'top',(yc-h/2)+'px');
    }
  }
}

function notificationUI(drug) {
  var pos = null;
  for (var i=0;i<plots.length;i++) {
    if (drug==plots[i].id.slice(8)) pos=i;
  }
  if (pos==null) return;
  var ypos = Math.round(31+(pos+0.5)*(window.innerHeight-31-26)/plots.length);
  var id = drug+'-notification';
  mqDelete(id+'-window');
  var w = 300;
  var h = 72;
  var x = 4;
  var y = 4;
  var wnd = mqWindow({
    id: id,
    width: w+'px',
    height: h+'px',
    y: (ypos-h/2)+'px',
    borderless: true,
  });
  mqAppend(wnd,mqLabel({ 
    id: id+'-message',
    x: x+'px', 
    y: y+'px', 
    label: '<b>NOTIFICATION</b>', 
    width: (w-70-4-4-4)+'px',
    height: (h-8)+'px'
  }));
  x+=(w-70-8);
  function makeDismisser(id) { 
    return function () { 
      var dis = parseInt(mqElement(id+'-dismiss-row').innerText);
      if (!mqNaN(dis)) dismissedNotifications.push(dis);
    }
  };
  mqAppend(wnd,mqButton({
    id: id+'-dismiss',
    x: x+'px',
    y: y+'px',
    width: 70+'px',
    label: 'Dismiss',
    onclick: makeDismisser(id)
  }));
  mqAppend(wnd,mqMakeWidget({
    tag: 'div',
    id: id+'-dismiss-row',
    display: 'none'
  }));
  mqSet(id+'-window','class','notification');
}

function notifyAll (elapsedSec) {
  var elapsedMin = elapsedSec/60.0;
  var dispatch = {};
  var alarm = null;
  for (var i=0;i<stanpumpConfig.time.length;i++) {
    if (dismissedNotifications.includes(i)) continue;
    var t = stanpumpConfig.time[i];
    var drug = stanpumpConfig.drug[i];
    if (elapsedMin<t+1&&t-elapsedMin<2) {
      if (dispatch[drug]==null) dispatch[drug]={ entries: [], messages: [] };
      dispatch[drug].entries.push(i+1);
      var dose = stanpumpConfig.dose[i];
      var unit = stanpumpConfig.units[i];
      var delta = Math.round(t*60-elapsedSec);
      if (delta==0) alarm=0;
      var msg = dose + ' ' + unit + (delta>0?' in ':' ')+delta+'sec';
      if (delta<0) msg='<font color="red">' + msg + '</font>';
      dispatch[drug].messages.push(msg);
    } 
  }
  for (var i=0;i<plots.length;i++) {
    var drug = plots[i].id.slice(8);
    if (dispatch[drug]==null) {
      mqDelete(drug+'-notification-window');
    } else if (realtimeNotifications) {
      if (!mqElement(drug+'-notification-window')) { notificationUI(drug); alarm=3; }
      var msg = '<pre>' + 
        drug.toUpperCase() + ' (' + dispatch[drug].entries.join(',') + ')\n<b>' +
        dispatch[drug].messages.join('\n');
      for (var j=dispatch[drug].messages.length;j<3;j++) msg+='\n&nbsp;';
      msg+='</pre></b>';
      mqSet(drug+'-notification-message','innerHTML', msg);
      var mintime = stanpumpConfig.time[dispatch[drug].entries[0]-1];
      var minentry = dispatch[drug].entries[0]-1;
      for (var j=1;j<dispatch[drug].entries.length;j++) { 
        var t1 = stanpumpConfig.time[dispatch[drug].entries[j]-1];
        if (t1<mintime) { mintime = t1; minentry = dispatch[drug].entries[j]-1; }
      }
      mqSet(drug+'-notification-dismiss-row','innerHTML', minentry+'');
    }
  }
  repositionNotifications();
  if (alarm!=null&&realtimeNotifications) alarmSounds[alarm].play();
}

function updateNotifications () {
  function getTimeInSeconds(str) {
    let curr_time = [];
    curr_time = str.split(':')
    for (let i = 0; i < curr_time.length; i++) {
      curr_time[i] = parseInt(curr_time[i]);
    }
    let t = curr_time[0] * 60 * 60
      + curr_time[1] * 60
      + curr_time[2];
    return t;
  }
  var d = new Date();
  var clocknow = d.toTimeString().split(' ')[0];
  var clockstart = (stanpumpConfig.starttime||'00.00.00').split('.').join(':');
  var tnow = getTimeInSeconds(clocknow);
  var tstart = getTimeInSeconds(clockstart); 
  var casetime = tnow - tstart;
  if (casetime>=-120&&casetime<=stanpumpConfig.maximum*60) 
    notifyAll(casetime); else clearNotifications();
  var pos=0;
  if (casetime<signalbase.zoomBegin) pos=0; 
    else if (casetime>signalbase.zoomEnd) pos=1;
     else pos = (casetime - signalbase.zoomBegin)/(signalbase.zoomEnd-signalbase.zoomBegin);
  for (var i=0;i<plots.length;i++) { 
    plots[i].mark(pos);
  }
  setTimeout(updateNotifications,500);
}

function initNotifications() {
  updateNotifications();
}

