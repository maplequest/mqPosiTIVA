
var dosingEntry = null;

function clearDosingTable () {
  undoBegin();
  stanpumpConfig.time=[];
  stanpumpConfig.drug=[];
  stanpumpConfig.dose=[];
  stanpumpConfig.units=[];
  undoEnd();
}

function deleteDrug(drugstr) {
  var time=[];
  var drug=[];
  var dose=[];
  var units=[];
  for (var i=0;i<stanpumpConfig.time.length;i++) {
    if (stanpumpConfig.drug[i]!=drugstr) { 
      time.push(stanpumpConfig.time[i]);
      drug.push(stanpumpConfig.drug[i]);
      dose.push(stanpumpConfig.dose[i]);
      units.push(stanpumpConfig.units[i]);
    }
  }
  undoBegin();
  stanpumpConfig.time=time;
  stanpumpConfig.drug=drug;
  stanpumpConfig.dose=dose;
  stanpumpConfig.units=units;
  undoEnd();
}

function removeDrugNear(drugstr,timepoint) {
  var dist=1;  // maximum distance in minutes
  var match=null;
  for (var i=0;i<stanpumpConfig.time.length;i++) {
    if (stanpumpConfig.drug[i]==drugstr) { 
      var dist2 = Math.abs(stanpumpConfig.time[i]-timepoint);
      if (dist2<dist) {
        dist = dist2; 
        match = i;
      }
    }
  }
  if (match==null) return;
  var time=[];
  var drug=[];
  var dose=[];
  var units=[];
  for (var i=0;i<stanpumpConfig.time.length;i++) {
    if (i!=match) {
      time.push(stanpumpConfig.time[i]);
      drug.push(stanpumpConfig.drug[i]);
      dose.push(stanpumpConfig.dose[i]);
      units.push(stanpumpConfig.units[i]);
    }
  }
  undoBegin();
  stanpumpConfig.time=time;
  stanpumpConfig.drug=drug;
  stanpumpConfig.dose=dose;
  stanpumpConfig.units=units;
  undoEnd();
}

function removeEventNear(timepoint) {
  var dist=1;  // maximum distance in minutes
  var match=null;
  if (!stanpumpConfig.eventtimes) return null;
  for (var i=0;i<stanpumpConfig.eventtimes.length;i++) {
    var dist2 = Math.abs(stanpumpConfig.eventtimes[i]-timepoint);
    if (dist2<dist) {
      dist = dist2;
      match = i;
    }
  } 
  if (match==null) return null;
  var eventtimes = [];
  var eventnames = [];
  for (var i=0;i<stanpumpConfig.eventtimes.length;i++) {
    if (i!=match ) {
      eventtimes.push(stanpumpConfig.eventtimes[i]);
      eventnames.push(stanpumpConfig.eventnames[i]);
    }
  }
  undoBegin();
  stanpumpConfig.eventtimes=eventtimes;
  stanpumpConfig.eventnames=eventnames;
  undoEnd();
  return match;
}

function removeAnnotationNear(timepoint) {
  var dist=1;  // maximum distance in minutes
  var match=null;
  if (!stanpumpConfig.annotations) return null;
  for (var i=0;i<stanpumpConfig.annotations.length;i++) {
    var dist2 = Math.abs(stanpumpConfig.annotations[i][0]-timepoint);
    if (dist2<dist) {
      dist = dist2;
      match = i;
    }
  }
  if (match==null) return null;
  var annotations= [];
  for (var i=0;i<stanpumpConfig.annotations.length;i++) {
    if (i!=match ) {
      annotations.push(stanpumpConfig.annotations[i]);
    }
  }
  undoBegin();
  stanpumpConfig.annotations=annotations;
  undoEnd();
  return match;
}

function removeEventOrAnnotationNear(timepoint) {
  if (removeEventNear(timepoint)==null) 
   removeAnnotationNear(timepoint);
}

function tabulateString(str,len) {
  var l = str.length;
  var res = str;
  var tab = "	";
  while (l<len) { res+=tab; l+=8; }
  return res;
}

function updateDosingUI() {
  function min2str (m) {
    var timestamp = (stanpumpConfig.starttime||'00.00.00').split(".").map(parseFloat);
    timestamp[1]+=m;
    while (timestamp[1]>=60) {
      timestamp[1]-=60;
      timestamp[0]+=1;
    }
    if (timestamp[0]>=24) { timestamp[0]-=24; }
    var str = 
      timestamp[0].toFixed(0).padStart(2,'0') + ':' +
      timestamp[1].toFixed(0).padStart(2,'0') + ':' +
      timestamp[2].toFixed(0).padStart(2,'0') + ' ' + 
      "(+" + m + ")";
    return str;
  }
  if (!mqElement('dosing-window')) return;
  dosingEntry=null;
  var entries = [];
  for (var i=0;i<stanpumpConfig.time.length;i++) {
    var time = stanpumpConfig.time[i];
    var drug = stanpumpConfig.drug[i];
    var dose = stanpumpConfig.dose[i];
    var unit = stanpumpConfig.units[i];
    var str = "<pre>" + (i+1) + ' '; 
    str+=tabulateString(drug,23);
    str+='\n';
    str+=tabulateString(min2str(time),16);
    str+=tabulateString(dose.toFixed(2).padStart(7," "),8);
    str+=' ' + unit;
    str+="</pre>"
    entries.push(str);
  }
  mqListSetEntries('dosing-table', entries, function (lbl) { dosingEntry = parseFloat(lbl.split(' ')[0])-1; })
  mqSet('dosing-filename','innerHTML',stanpumpConfig.filename||"");
  var dur = stanpumpConfig.maximum||0;
  var h = Math.floor(dur/60);
  var m = dur - h*60;
  mqSet('dosing-duration','innerHTML',
   h.toFixed(0).padStart(2,'0')+':'+m.toFixed(0).padStart(2,'0'))
  var str = (stanpumpConfig.starttime||'00.00.00').split('.').join(':');
  mqSet('dosing-clock','innerHTML',str);
   
}

function parseTimestamp(str) {
  var nums = str.split(':').map(parseFloat);
  if (nums.length==2) nums.push(0);
  if (nums.length!=3) return null;
  var ok = true;
  for (var i=0;i<3;i++) {
    var x = nums[i];
    if (mqNaN(x)||x<0||x>=60) ok=false;
  }
  return (ok?nums:null);
}

function dosingUI () {
  mqDelete('dosing-window');
  var h = 350;
 // var w = 4*120 + 5*8;
  var w = 350;
  var bw = 77.5;
  var x,y;
  var wnd = mqWindow({
    id: 'dosing', title: 'Dosing Table',
    width: w+'px', height: h+'px',
    onclose: function () {}
  });
  x=8; y=32;
  mqAppend(wnd,mqLabel({ x: x+'px', y: y+'px', label: 'Simulation name:', align: 'right'}));
  x+=120+8;
  mqAppend(wnd,mqInput({
    id: 'dosing-filename',
    x: x+'px', y: y+'px', value: '',
    width: (w-8-120-8-8)+'px',
    onenter: function (obj) {
      undoBegin();
      stanpumpConfig.filename=obj.innerText;
      undoEnd();
    }
  }));
  x=8; y+=32;
  mqAppend(wnd,mqLabel({ 
    x: x+'px', 
    y: y+'px', 
    width: 40+'px',
    label: 'Start:', 
    align: 'right'
  }));
  x+=40+8;
  mqAppend(wnd,mqInput({
    id: 'dosing-clock',
    x: x+'px', 
    y: y+'px', 
    value: '00:00',
    width: bw+'px',
    onenter: function (obj) {
      var str = obj.innerText;
      var nums = parseTimestamp(str);
      if (nums) {
        undoBegin();
        stanpumpConfig.starttime = 
          nums[0].toFixed(0).padStart(2,'0') + '.' + 
          nums[1].toFixed(0).padStart(2,'0') + '.' + 
          nums[2].toFixed(0).padStart(2,'0');
        undoEnd();
      } else {
        console.warn('Invalid entry');
        obj.innerText="";
      } 
    }
  }));
  x+=bw+8;
  mqAppend(wnd,mqButton({
    id: 'dosing-now',
    x: x+'px', y: y+'px', 
    label: 'Now',
    width: 40+'px',
    onclick: function () { 
      undoBegin();
      var d = new Date();
      stanpumpConfig.starttime = d.toTimeString().split(' ')[0].split(':').join('.'); 
      undoEnd();
    }
  }));
  x+=40+8;
  mqAppend(wnd,mqLabel({ x: x+'px', y: y+'px', 
    width: 67+'px',
    label: 'Duration:', align: 'right'}));
  x+=67+8;
  mqAppend(wnd,mqInput({
    id: 'dosing-duration',
    x: x+'px', y: y+'px', value: '00:00',
    width: bw+'px',
    onenter: function (obj) {
      var str = obj.innerText;
      var nums = obj.innerText.split(':').map(parseFloat);
      if (nums.length==1&&!mqNaN(nums[0])&&nums[0]>0) {
         undoBegin();
         stanpumpConfig.maximum=nums[0];
         undoEnd();
      } else {
        nums = parseTimestamp(str);
        if (nums) {
           undoBegin();
           stanpumpConfig.maximum=60*nums[0]+nums[1]+nums[2]/60;
           undoEnd();
        } else {
          console.warn('Invalid entry');
          obj.innerText="";
        }
      }
    }
  }));
  x=8;
  y=32+32+32;
  mqAppend(wnd,mqList({
    id: 'dosing-table',
    x: x+'px', y: y+'px', width: (w-16)+'px', height: (h-32-32-32-32-8)+'px',
    entries: [
     "Loading.."
    ],
    onclick: function () {}
  }));
  x=8;
  y=h-32;
  mqAppend(wnd,mqButton({
    id: 'dosing-clear',
    x: x+'px',
    y: y+'px', 
    label: 'Clear All',
    width: bw+'px',
    onclick: clearDosingTable
  }));
  x+=bw+8;
  mqAppend(wnd,mqButton({
    id: 'dosing-delete',
    x: x+'px', 
    y: y+'px', 
    label: 'Delete',
    width: bw+'px',
    onclick: function () {
      if (dosingEntry==null) { console.warn('No entry selected'); return; }
      mqDelete('dosing-entry-window');
      undoBegin();
      stanpumpConfig.drug.splice(dosingEntry,1);
      stanpumpConfig.time.splice(dosingEntry,1);
      stanpumpConfig.dose.splice(dosingEntry,1);
      stanpumpConfig.units.splice(dosingEntry,1);
      dosingEntry=null;
      undoEnd();
    }
  }));
  x+=bw+8;
  mqAppend(wnd,mqButton({
    id: 'dosing-edit',
    x: x+'px',  
    y: y+'px', 
    label: 'Edit',
    width: bw+'px',
    onclick: function () {
      if (dosingEntry==null) console.warn('No entry selected'); else dosingEntryUI();
    }
  }));
  x+=bw+8;
  mqAppend(wnd,mqButton({
    id: 'dosing-add',
    x: x+'px', 
    y: y+'px', 
    label: 'Add',
    width: bw+'px',
    onclick: function () {
      dosingEntry=null;
      updateDosingUI();
      dosingEntryUI();
    }
  }));
  updateDosingUI();
}

var dosingEntryDrug;
var dosingEntryDose;
var dosingEntryUnit;
var dosingEntryTime;

function processDosingEntry () {
  if (dosingEntry==null) {
    stanpumpConfig.drug.push(dosingEntryDrug);
    stanpumpConfig.dose.push(dosingEntryDose);
    stanpumpConfig.units.push(dosingEntryUnit);
    stanpumpConfig.time.push(dosingEntryTime);
    stanpumpDirty=true;
  } else {
    stanpumpConfig.drug[dosingEntry]=dosingEntryDrug;
    stanpumpConfig.dose[dosingEntry]=dosingEntryDose;
    stanpumpConfig.units[dosingEntry]=dosingEntryUnit;
    stanpumpConfig.time[dosingEntry]=dosingEntryTime;
    stanpumpDirty=true;
  }
}

function updateDosingEntryUI() {
  if (!mqElement('dosing-entry-window')) return;
  mqSet('dosing-entry-titlebar','innerHTML',dosingEntry==null?'New Dose Entry':'Edit Dose Entry ' + (dosingEntry+1));
  var dose = (dosingEntry==null?0:stanpumpConfig.dose[dosingEntry]);
  var unit = (dosingEntry==null?null:stanpumpConfig.units[dosingEntry]);
  var time = (dosingEntry==null?0:stanpumpConfig.time[dosingEntry]);
  var drug = (dosingEntry==null?null:stanpumpConfig.drug[dosingEntry]);
  mqSet('dosing-entry-time','innerHTML',time+'');
  mqSet('dosing-entry-dose','innerHTML',dose+'');
  mqListSetEntries('dosing-entry-drugs', drugDefaultGlobal['Drug'], function (lbl) {
    dosingEntryDrug=lbl;
    dosingEntryUnit=null;
    mqListSetEntries('dosing-entry-units',
      stanpumpDefaults[lbl].units.split(','),
      function (lbl) { dosingEntryUnit=lbl; });
  }, drug);
  mqListSetEntries('dosing-entry-units',
    (drug==null?[]:stanpumpDefaults[drug].units.split(',')),
    function (lbl) { dosingEntryUnit=lbl; }, unit);
  dosingEntryDrug=drug;
  dosingEntryDose=dose;
  dosingEntryUnit=unit;
  dosingEntryTime=time;
}

function applyDosingEntry() {
  if (!mqElement('dosing-entry-window')) return;
  var tmp = parseFloat(mqElement('dosing-entry-dose').innerText);
  if (mqNaN(tmp)) {
    mqSet('dosing-entry-dose','innerHTML','');
    dosingEntryDose=null;
  } else {
    dosingEntryDose = tmp;
  }
  tmp = parseFloat(mqElement('dosing-entry-time').innerText);
  if (mqNaN(tmp)) {
    tmp = parseTimestamp(mqElement('dosing-entry-time').innerText);
    if (tmp==null) {
      mqSet('dosing-entry-time','innerHTML','');
      dosingEntryTime=null;
    } else {
      dosingEntryTime=tmp[0]*60+tmp[1]+tmp[2]/60;
    }
  } else {
    dosingEntryTime = tmp;
  }
  if (dosingEntryDrug==null) { console.warn('No drug selected'); return; }
  if (dosingEntryUnit==null) { console.warn('No unit selected'); return; }
  if (dosingEntryDose==null) { console.warn('No dose specified'); return; }
  if (dosingEntryTime==null) { console.warn('No time specified'); return; }
  processDosingEntry();
  mqDelete('dosing-entry-window');
}

function dosingEntryUI () {
  mqDelete('dosing-entry-window');
  dosingEntryDrug=null;
  dosingEntryDose=null;
  dosingEntryUnit=null;
  var h = 202;
  //var w = 3*120 + 4*8;
  var w = 350;
  var x,y;
  var wnd = mqWindow({
    id: 'dosing-entry', 
    title: 'Dosing Entry',
    width: w+'px', height: h+'px',
    onclose: function () {}
  });
  x=8; y=32;
  mqAppend(wnd,mqLabel({ x: x+'px', y: y+'px', label: 'Time (min):'}));
  x+=85;
  mqAppend(wnd,mqInput({
    id: 'dosing-entry-time',
    x: x+'px',
    y: y+'px',
    value: '',
    onenter: applyDosingEntry
  }));
  x+=128;
  mqAppend(wnd,mqLabel({ x: x+'px', y: y+'px', label: 'Dose:'}));
  x=8;
  y+=32;
  mqAppend(wnd,mqList({
    id: 'dosing-entry-drugs',
    x: x+'px',
    y: y+'px',
    width: 206+'px',
    height: (h-y-8)+'px',
    entries: [],
    selected: null,
  }));
  y=32;
  x+=248+8;
  mqAppend(wnd,mqInput({
    id: 'dosing-entry-dose',
    x: x+'px', 
    y: y+'px', 
    value: '0.0',
    width: '78px',
    onenter: applyDosingEntry
  }));
  y+=32;
  x=214+8;
  mqAppend(wnd,mqList({
    id: 'dosing-entry-units',
    x: x+'px',
    y: y+'px',
    width: 120+'px',
    height: (h-y-32-8)+'px',
    entries: [],
    selected: null,
  }));
  x=w-120-8;
  y=h-32;
  mqAppend(wnd,mqButton({
    id: 'dosing-entry-apply',
    x: x+'px', y: y+'px', label: 'Apply',
    onclick: applyDosingEntry
/*
function () { 
      var tmp = parseFloat(mqElement('dosing-entry-dose').innerText);
      if (mqNaN(tmp)) {
        mqSet('dosing-entry-dose','innerHTML','');
        dosingEntryDose=null;
      } else {
        dosingEntryDose = tmp;
      }
      tmp = parseFloat(mqElement('dosing-entry-time').innerText);
      if (mqNaN(tmp)) {
        tmp = parseTimestamp(mqElement('dosing-entry-time').innerText);
        if (tmp==null) {
          mqSet('dosing-entry-time','innerHTML','');
          dosingEntryTime=null;
        } else {
          dosingEntryTime=tmp[0]*60+tmp[1]+tmp[2]/60;
        }
      } else {
        dosingEntryTime = tmp;
      }
      if (dosingEntryDrug==null) { console.warn('No drug selected'); return; }
      if (dosingEntryUnit==null) { console.warn('No unit selected'); return; }
      if (dosingEntryDose==null) { console.warn('No dose specified'); return; }
      if (dosingEntryTime==null) { console.warn('No time specified'); return; }
      processDosingEntry();
      mqDelete('dosing-entry-window');
    }
*/
  }));
  updateDosingEntryUI();
}

function dosingSortByDrug () {
  var sorted = [];
  for (var i=0;i<stanpumpConfig.time.length;i++) {
    sorted.push(stanpumpConfig.drug[i]+' '+stanpumpConfig.time[i].toFixed(0).padStart(4,'0')+' '+ i);
  }
  mqSort(sorted);
  var time = [];
  var dose = [];
  var drug = [];
  var unit = [];
  for (var i=0;i<sorted.length;i++) {
    for (var j=0;j<sorted.length;j++) {
      var tmp = stanpumpConfig.drug[j]+' '+stanpumpConfig.time[j].toFixed(0).padStart(4,'0')+' '+ j;
      if (tmp==sorted[i]) {
        time.push(stanpumpConfig.time[j]);
        dose.push(stanpumpConfig.dose[j]);
        drug.push(stanpumpConfig.drug[j]);
        unit.push(stanpumpConfig.units[j]);
      }
    }
  }
  stanpumpConfig.time = time;
  stanpumpConfig.dose = dose;
  stanpumpConfig.drug = drug;
  stanpumpConfig.units = unit;
  stanpumpDirty=true;
}

function dosingSortByTime () {
  var sorted = [];
  for (var i=0;i<stanpumpConfig.time.length;i++) {
    sorted.push(stanpumpConfig.time[i].toFixed(0).padStart(4,'0')+' '+stanpumpConfig.drug[i]+' '+ i);
  }
  mqSort(sorted);
  var time = [];
  var dose = [];
  var drug = [];
  var unit = [];
  for (var i=0;i<sorted.length;i++) {
    for (var j=0;j<sorted.length;j++) {
      var tmp = stanpumpConfig.time[j].toFixed(0).padStart(4,'0')+' '+stanpumpConfig.drug[j]+' '+ j;
      if (tmp==sorted[i]) {
        time.push(stanpumpConfig.time[j]);
        dose.push(stanpumpConfig.dose[j]);
        drug.push(stanpumpConfig.drug[j]);
        unit.push(stanpumpConfig.units[j]);
      }
    }
  }
  stanpumpConfig.time = time;
  stanpumpConfig.dose = dose;
  stanpumpConfig.drug = drug;
  stanpumpConfig.units = unit;
  stanpumpDirty=true;
}

function initDosingTable () {
  mqCSS('dosing-table','.dosing-table-entries { height: 34px !important }');
}

