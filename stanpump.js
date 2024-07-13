
// translated from stanpumpR
var eventDefaults = {
  "Event": [ "Start","Timeout","Induction","Intubation","Extubation","Emergence",
     "End","CPB Start","CPB36","CPB35","CPB34","CPB33","CPB32","CPB31","CPB End",
     "Clamp On","Clamp Off","Tourniquet On","Tourniquet Off","Other","Add Events"],
  "Color":["blue","blue","green","green","green","green","blue","#FF40FF","#d232f2",
     "#a828e8","#7e1ede","#5414d4","#2a0aca","#181CAE","brown","red","brown","red",
     "brown","orange","black"]
  };

// translated from stanpumpR
var drugDefaultGlobal = {
  "Drug": ["propofol","remifentanil","fentanyl","alfentanil","sufentanil","morphine",
      "pethidine","hydromorphone","methadone","ketamine","dexmedetomidine","midazolam",
      "etomidate","lidocaine","rocuronium","naloxone","oxytocin","oxycodone","oliceridine"],
  "Concentration.Units":["mcg","ng","ng","ng","ng","mcg","mcg","ng","mcg","mcg","ng",
       "mcg","mcg","mcg","mcg","ng","ng","ng","ng"],
  "Bolus.Units":["mg","mcg","mcg","mcg","mcg","mg","mg","mg","mg","mg","mcg","mg","mg",
       "mg","mg","mcg","mcg","NA","mg"],
  "Infusion.Units":["mcg/kg/min","mcg/kg/min","mcg/kg/hr","mcg/kg/hr","mcg/kg/hr",
       "mg/hr","mg/hr","mg/hr","mg/hr","mg/hr","mcg/kg/hr","mg/hr","mg/kg/min","mg/hr",
       "mg/kg/hr","mcg/min","mcg/min","NA","mcg/kg/min"],
  "Default.Units":["mg","mcg/kg/min","mcg","mcg","mcg","mg","mg","mg","mg","mg",
       "mcg/kg/hr","mg","mg","mg","mg","mcg","mcg","mg PO","mg"],
  "Units":["mg,mg/kg,mcg/kg/min,mg/kg/hr","mcg,mcg/kg,mcg/kg/min","mcg,mcg/kg,mcg/kg/hr",
       "mcg,mcg/kg,mcg/kg/hr","mcg,mcg/kg,mcg/kg/hr","mg,mg/hr","mg,mg/hr",
       "mg,mg/kg,mg/hr,mg/kg/hr,mg PO,mg IM,mg IN","mg,mg/hr","mg,mg/kg,mg/hr,mg/kg/hr",
       "mcg,mcg/kg,mcg/hr,mcg/kg/hr","mg,mg/kg,mg/hr","mg,mg/kg/min","mg,mg/hr",
       "mg,mg/kg/hr","mcg,mcg/kg,mg,mg/kg,mcg/min,mcg/kg/min,mg/min,mg/kg/min",
       "mcg,mg,mg/kg,mcg/min","mg PO","mg,mcg/kg/min"],
  "Color":["#FFCC00","#0000C0","#0491E2","#0491E2","#0491E2","#032FED","#5155FF",
        "#032FED","#71C5E8","#FFCC00","#791AEE","#E36C0A","#FFCC00","#B7AE7F",
        "#F9423A","#404040","#008F7D","#032FED","#FF00CC"],
  "Lower":[2.5,0.8,0.48,31.2,0.0448,0.0064,0.2,1.2,0.048,0.1,0.4,0.04,0.4,0.5,1,0,0.05,10,18.296],
  "Upper":[4,2,1.2,78,0.112,0.016,0.5,3,0.12,0.16,0.8,0.12,0.8,1.5,2.2,0,0.2,20,37.504],
  "Typical":[3,1.2,0.72,46.8,0.0672,0.0096,0.3,1.8,0.072,0.12,10,0.1,0.5,1,1.5,0,0.1,14,27.4],
  "MEAC":[0,1,0.6,39,0.056,0.008,0.25,1.5,0.06,0,0,0,0,0,0,0,0,12,27.9],
  "endCe":[1,1,0.6,39,0.056,0.008,0.25,1.5,0.06,0.1,0.4,0.04,0.4,0.5,1,1,0.05,10,27.4],
  "endCeText":["emergence","ventilation","ventilation","ventilation","ventilation",
       "ventilation","ventilation","ventilation","ventilation","emergence","emergence",
       "wakefulness","emergence","emergence","reversable","no effect","no effect","ventilation","ventilation"]
  };

var stanpumpDefaults = {}

var stanpumpError = null;
/*
var stanpumpDirty = true;

var stanpumpConfig = {
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
};
*/

var stanpumpDirty=false;
var stanpumpConfig;

var stanpumpResult = "";

function resample(times,signal) {
  var res = [];
  var duration = 60*Math.ceil(times.slice(-1));
  var t=0;
  var dt = 1;
  var t1,t2;
  var i=0;
  while (t<duration) {
    if (t2==null||t/60.0>t2) {
      t1=times[i];
      t2=times[i+1];
      i++;
    }
    var y1 = signal[i-1];
    var y2 = signal[i];
    var slope = (y2-y1)/(t2-t1);
    res.push(slope*(t/60.0-t1)+y1);
    t+=dt;
  }
  return res;
}

function stanpumpTrend(label,numdata,unit='au') {
  signalbase.data.signals.push(numdata);
  signalbase.data.labels.push(label);
  signalbase.data.srates.push(1);
  signalbase.data.dims.push(unit);
  signalbase.data.bits.push(16);
  signalbase.data.resolution.push(0);
}

function stanpumpProcessSimulation() {
  var drugs = [];
  var data = JSON.parse(stanpumpResult).map((x)=>x['results']);
  signalbase.clear();
  for (var i=0;i<data.length;i++) {
    var drug = data[i]['Drug'][0];
    drugs.push(drug);
    var times = data[i]['Time'];
    stanpumpTrend(drug+'Cp',resample(times, data[i]['Plasma']));
    stanpumpTrend(drug+'Ce',resample(times, data[i]['Effect Site']));
    stanpumpTrend(drug+'CpNormCp',resample(times, data[i]['CpNormCp']));
    stanpumpTrend(drug+'CeNormCp',resample(times, data[i]['CeNormCp']));
    stanpumpTrend(drug+'CpNormCe',resample(times, data[i]['CpNormCe']));
    stanpumpTrend(drug+'CeNormCe',resample(times, data[i]['CeNormCe']));
  }
  var annotations = {};
  // annotate dosing
  for (var i=0;i<stanpumpConfig.time.length;i++) {
    var tstamp = 'T'+60*stanpumpConfig.time[i];
    var drug = stanpumpConfig.drug[i];
    var name = (i+1)+'^'+drug;
    if (annotations[tstamp]==null) 
      annotations[tstamp]=name;
    else
      annotations[tstamp]+=','+name;
  }
  // annotate events
  if (stanpumpConfig.eventtimes&&stanpumpConfig.eventnames) {
    for (var i=0;i<stanpumpConfig.eventtimes.length;i++) {
      var tstamp = 'T'+60*stanpumpConfig.eventtimes[i];
      var name = stanpumpConfig.eventnames[i];
      if (annotations[tstamp]==null)
        annotations[tstamp]=name;
      else
        annotations[tstamp]+=','+name;
    }
  }
  // annotate general 
  if (stanpumpConfig.annotations) {
    for (var i=0;i<stanpumpConfig.annotations.length;i++) {
      var tstamp = 'T'+60*stanpumpConfig.annotations[i][0];
      var name = stanpumpConfig.annotations[i][1];
      if (annotations[tstamp]==null)
        annotations[tstamp]=name;
      else
        annotations[tstamp]+=','+name;
    }
  }
  for (const ann in annotations) {
    var ofs = parseInt(ann.slice(1));
    if (ofs==0) ofs=0.1;
    var lbl = annotations[ann];
    signalbase.annotate(lbl,ofs);
  }
  signalbase.data.filename=stanpumpConfig.filename||'stanpumpR';
  signalbase.data.startdate=stanpumpConfig.startdate||'01.01.01';
  signalbase.data.starttime=stanpumpConfig.starttime||'00.00.00';
  signalbase.record=false;
  signalbase.zoomBegin=0;
  signalbase.zoomEnd=signalbase.duration();
  mqSet('working','display','none');
  plots=[];
  var alldrugs = drugDefaultGlobal['Drug'];
  for (var i=0;i<alldrugs.length;i++) { 
    mqDelete('plotter-' + alldrugs[i] + '-container');
    desktop.menubar.checkSubmenu('mb-plotters',alldrugs[i],false);
  }
  for (var i=0;i<drugs.length;i++) { 
    var cb = desktop.menubar.getSubmenu('mb-plotters',drugs[i])[1];
    cb();
    desktop.menubar.checkSubmenu('mb-plotters',drugs[i],true);
  }
  signalbase.onafterload();
  signalbase.onchange();
  updateDosingUI();
  updateCovariatesUI();
  clearNotifications();
  mqStorageSetJSON('stanpump-config',stanpumpConfig);
}

function stanpumpErrorUI () {
  mqDialogOK({
   title: 'StanpumpR Error',
   label: 'Something went wrong. Reverting to last good simulation.',
   onclick: function () { undo() } 
  });
}

function initStanpump () {
  // refactor stanpumpR configuration data
  for (var i=0;i<drugDefaultGlobal['Drug'].length;i++) {
    var entry = {};
    entry.concentrationUnits = drugDefaultGlobal['Concentration.Units'][i];
    entry.bolusUnits = drugDefaultGlobal['Bolus.Units'][i];
    entry.infusionUnits = drugDefaultGlobal['Infusion.Units'][i];
    entry.defaultUnits = drugDefaultGlobal['Default.Units'][i];
    entry.units = drugDefaultGlobal['Units'][i];
    entry.color = drugDefaultGlobal['Color'][i];
    entry.lower = drugDefaultGlobal['Lower'][i];
    entry.upper = drugDefaultGlobal['Upper'][i];
    entry.typical = drugDefaultGlobal['Typical'][i];
    entry.meac = drugDefaultGlobal['MEAC'][i];
    entry.endCe = drugDefaultGlobal['endCe'][i];
    entry.endCeText = drugDefaultGlobal['endCeText'][i];
    stanpumpDefaults[drugDefaultGlobal['Drug'][i]]=entry;
  }
  // load WebR in a roundabout way to avoid closure compiler choking
  var webr = document.createElement('script');
  webr.setAttribute('src',mqVersion+'/webr-app.js');
  document.head.appendChild(webr);
  // hide the drug menu
  mqSet('mb-plotters','display','none');
}

var stanpumpPendingSuggestions=[]

// { Drug: "remifentanil", Time: [1], Target: [4], EndTime: 60 }
function stanpumpSuggest(sug) {
  undoBegin();
  stanpumpConfig.action = "suggest";
  stanpumpConfig.suggestDrug = sug.Drug;
  stanpumpConfig.suggestTime = sug.Time;
  stanpumpConfig.suggestTarget = sug.Target;
  stanpumpConfig.suggestEndTime = sug.EndTime;
  undoEnd();
}

function stanpumpDeleteDrug(drug0) {
  var time = [];
  var drug = [];
  var dose = [];
  var units = [];
  for (var i=0;i<stanpumpConfig.time.length;i++) {
    if (stanpumpConfig.drug[i]!=drug0) {
      time.push(stanpumpConfig.time[i]);
      drug.push(stanpumpConfig.drug[i]);
      dose.push(stanpumpConfig.dose[i]);
      units.push(stanpumpConfig.units[i]);
    } 
  }
  stanpumpConfig.time = time;
  stanpumpConfig.drug = drug;
  stanpumpConfig.dose = dose;
  stanpumpConfig.units = units;
}

// merge suggestion and re-run simulation
function stanpumpProcessSuggestion () {
  var data = JSON.parse(stanpumpResult);
  var drug = data.Drug[0];
  // purge old drug entries
  stanpumpDeleteDrug(drug);
  // add new ones
  for (var i=0;i<data.Time.length;i++) {  
    stanpumpConfig.time.push(Math.floor(data.Time[i]));
    stanpumpConfig.drug.push(data.Drug[i]);
    stanpumpConfig.dose.push(data.Dose[i]);
    stanpumpConfig.units.push(data.Units[i]);
  }
  if (stanpumpPendingSuggestions.length==0) {
    // scrub 
    delete stanpumpConfig.action; 
    delete stanpumpConfig.suggestDrug; 
    delete stanpumpConfig.suggestTime; 
    delete stanpumpConfig.suggestTarget; 
    delete stanpumpConfig.suggestEndTime; 
    // rerun simulation
    stanpumpConfig.action="simulate";
    stanpumpDirty=true;
  } else {
    var sug = stanpumpPendingSuggestions.shift();
    stanpumpConfig.action="suggest";
    stanpumpConfig.suggestDrug = sug.Drug;
    stanpumpConfig.suggestTime = sug.Time;
    stanpumpConfig.suggestTarget = sug.Target;
    stanpumpConfig.suggestEndTime = sug.EndTime;
    stanpumpDirty=true;
  }
}

