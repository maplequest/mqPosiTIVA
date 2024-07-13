
var covariateAgeFactor=1.0;
var covariateWeightFactor=1.0;
var covariateHeightFactor=1.0;
var covariateSex;

function mqRadioBoxSet(id,group) {
  var objs = mqElementsOfClass(group);
  for (var i=0;i<objs.length;i++) {
    objs[i].checked=false;
    mqSet(objs[i],'background', mqPal(0.05).hex());
  }
  var obj = mqElement(id);
  obj.checked=true;
  mqSet(obj,'background', mqPal((obj.checked?1.0:0.05)).hex());
}

function updateCovariatesUI() {
  if (!mqElement('covariates-window')) return;
  covariateWeightFactor=1.0;
  covariateHeightFactor=1.0;
  covariateSex = stanpumpConfig.sex;
  var age = stanpumpConfig.age;
  var weight = stanpumpConfig.weight;
  var height = stanpumpConfig.height;
  if (age<1/12) {
    covariateAgeFactor=365.0;
    mqSet('covariates-age','innerHTML',(age*365).toFixed(0)+'');
    mqRadioBoxSet('covariates-age-days',"age-radio-group");
  } else if (age<1) { 
    covariateAgeFactor=12.0;
    mqSet('covariates-age','innerHTML',(age*12).toFixed(1)+'');
    mqRadioBoxSet('covariates-age-months',"age-radio-group");
  } else { 
    covariateAgeFactor=1.0;
    mqSet('covariates-age','innerHTML',age.toFixed(0)+'');
    mqRadioBoxSet('covariates-age-years',"age-radio-group");
  }
  mqSet('covariates-weight','innerHTML',weight.toFixed(2)+'');
  mqSet('covariates-height','innerHTML',height.toFixed(2)+'');
  mqRadioBoxSet('covariates-'+covariateSex,"sex-radio-group");
  mqRadioBoxSet('covariates-weight-kg',"weight-radio-group");
  mqRadioBoxSet('covariates-height-cm',"height-radio-group");
}

function applyCovariatesUI() {
  var age = parseFloat(mqGet('covariates-age','innerText'));
  var weight = parseFloat(mqGet('covariates-weight','innerText'));
  var height = parseFloat(mqGet('covariates-height','innerText'));
  if (mqNaN(age)||age<=0) { console.warn('Invalid age'); return; } else { age*=covariateAgeFactor; }
  if (mqNaN(weight)||weight<=0) { console.warn('Invalid weight'); return; } else { weight*=covariateWeightFactor; }
  if (mqNaN(height)||height<=0) { console.warn('Invalid height'); return; } else { height*=covariateHeightFactor; }
  undoBegin();
  stanpumpConfig.age = age;
  stanpumpConfig.weight = weight;
  stanpumpConfig.height = height;
  stanpumpConfig.sex=covariateSex;
  undoEnd();
}

function covariatesUI(wizardTitle,wizardNext) {
  mqDelete('covariates-window');
  var h = 320;
  var w = 2*120 + 3*8;
  var x,y;
  var wnd = mqWindow({
    id: 'covariates', 
    title: (wizardTitle?wizardTitle:'Patient Variables'),
    width: w+'px', height: h+'px',
    onclose: function () { }
  });
  // ---------------------------
  x=8; y=32;
  mqAppend(wnd,mqFrame({ x: x+'px', y: y+'px', height: '32px', width: '248px' }));
  y+=8;
  x=32;
  mqAppend(wnd,mqRadioBox({
    id: 'covariates-female',
    x: x+'px', y: y+'px', label: 'Female',
    group: "sex-radio-group", 
    //checked: true,
    onclick: function () { covariateSex="female"; }
  }));
  x+=120;
  mqAppend(wnd,mqRadioBox({
    id: 'covariates-male',
    x: x+'px', y: y+'px', label: 'Male',
    group: "sex-radio-group",
    onclick: function () { covariateSex="male"; }
  }));
  // ---------------------------
  y+=32;
  x=8;
  mqAppend(wnd,mqFrame({ x: x+'px', y: y+'px', height: '64px', width: '248px' }));
  y+=8; 
  x+=8;
  mqAppend(wnd,mqLabel({ x: x+'px', y: y+'px', label: 'Age:', align: 'right',width: '104px'}));
  x+=112;
  mqAppend(wnd,mqInput({
    id: 'covariates-age',
    x: x+'px',
    y: y+'px',
    value: '',
    onenter: function () {},
  }));
  y+=32;
  x=16;
  mqAppend(wnd,mqRadioBox({
    id: 'covariates-age-years',
    x: x+'px', y: y+'px', label: 'Years',
    group: "age-radio-group",
    checked: true,
    onclick: function () { covariateAgeFactor=1; }
  }));
  x+=80;
  mqAppend(wnd,mqRadioBox({
    id: 'covariates-age-months',
    x: x+'px', y: y+'px', label: 'Months',
    group: "age-radio-group",
    onclick: function () { covariateAgeFactor=1.0/12; }
  }));
  x+=92;
  mqAppend(wnd,mqRadioBox({
    id: 'covariates-age-days',
    x: x+'px', y: y+'px', label: 'Days',
    group: "age-radio-group",
    onclick: function () { covariateAgeFactor=1.0/365; }
  }));
  // ---------------------------
  y+=32;
  x=8;
  mqAppend(wnd,mqFrame({ x: x+'px', y: y+'px', height: '64px', width: '248px' }));
  y+=8;
  x+=8;
  mqAppend(wnd,mqLabel({ x: x+'px', y: y+'px', label: 'Weight:', align: 'right',width: '104px'}));
  x+=112;
  mqAppend(wnd,mqInput({
    id: 'covariates-weight',
    x: x+'px',
    y: y+'px',
    value: '',
    onenter: function () {},
  }));
  y+=32;
  x=32;
  mqAppend(wnd,mqRadioBox({
    id: 'covariates-weight-kg',
    x: x+'px', y: y+'px', label: 'Kilos',
    group: "weight-radio-group",
    checked: true,
    onclick: function () { covariateWeightFactor=1; }
  }));
  x+=120;
  mqAppend(wnd,mqRadioBox({
    id: 'covariates-weight-lb',
    x: x+'px', y: y+'px', label: 'Pounds',
    group: "weight-radio-group",
    onclick: function () { covariateWeightFactor=0.453592; }
  }));
  // ---------------------------
  y+=32;
  x=8;
  mqAppend(wnd,mqFrame({ x: x+'px', y: y+'px', height: '64px', width: '248px' }));
  y+=8;
  x+=8;
  mqAppend(wnd,mqLabel({ x: x+'px', y: y+'px', label: 'Height:', align: 'right',width: '104px'}));
  x+=112;
  mqAppend(wnd,mqInput({
    id: 'covariates-height',
    x: x+'px',
    y: y+'px',
    value: '',
    onenter: function () {},
  }));
  y+=32;
  x=32;
  mqAppend(wnd,mqRadioBox({
    id: 'covariates-height-cm',
    x: x+'px', y: y+'px', label: 'Centimeters',
    group: "height-radio-group",
    checked: true,
    onclick: function () { covariateHeightFactor=1; }
  }));
  x+=120;
  mqAppend(wnd,mqRadioBox({
    id: 'covariates-height-in',
    x: x+'px', y: y+'px', label: 'Inches',
    group: "height-radio-group",
    onclick: function () { covariateHeightFactor=2.54; }
  }));
  // ---------------------------
  x=w-120-8;
  y=h-32;
  mqAppend(wnd,mqButton({
    id: 'covariates-apply',
    x: x+'px', y: y+'px', 
    label: (wizardNext?'Next':'Apply'),
    onclick: function () {
      applyCovariatesUI()
      if (wizardNext) {
        mqDelete('covariates-window');
        wizardNext();
      } else {
        stanpumpDirty=true;
      }
    }
  }));
  // ---------------------------
  updateCovariatesUI();
}

