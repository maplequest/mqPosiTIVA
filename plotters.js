
var plotters = { };

var plots = [];

function makeSVGResizer(obj) {
  var idstr = obj.id;
  return function () {
    var e = mqElement(idstr+'-svg');
    if (e==null) return;
    // allow flex box to work
    mqAttr(e,'width','1');
    mqAttr(e,'height','1');
    setTimeout(function() {
      var e = mqElement(idstr+'-svg'); 
      if (e==null) return;
      var w = mqWidth(idstr);
      var h = mqHeight(idstr);
      mqAttr(e,'width',w);
      mqAttr(e,'height',h);
      mqAttr(e,'viewBox','0 0 ' + w + ' ' + h);
      obj.plot();
    },50); // 10
  }
}

function scrubDesktop() {
  var desktop = mqElement('desktop');
  var nodes = desktop.childNodes;
  for (const node of nodes) {
    if (node.nodeName!='DIV') desktop.removeChild(node);
  }
}

var lastRefresh=null;

function refreshPlots() {
/*
  if (lastRefresh==null) {
    lastRefresh = performance.now(); 
  } else {
    var thisRefresh = performance.now();
    var delta = thisRefresh - lastRefresh;
    console.log('delta='+Math.floor(delta));
    lastRefresh=thisRefresh;
  }
*/
  scrubDesktop();
  for (var i=0;i<plots.length;i++) plots[i].plot();
}

function addPlot(cfg) {
  var id = cfg.id;
  var pc = mqMakeWidget({
    tag: 'div',
    "id": id + "-container",
    "position": "relative",
    "background": "white"
  });
  var p = mqMakeWidget({
    tag: 'div',
    "id": id
  });
  var ps = mqMakeWidget({
    tag: 'img',
    "id": id + "-loading",
    "src": mqVersion+"/icons/spinner.gif",
    "height": "50px",
    "display": "none"
  });
  mqPositionCC(ps);
  mqPositionTL(p);
  mqSet(p,'height','100%');
  mqSet(p,'width','100%');
  mqAppend(pc,p);
  mqAppend(pc,ps);
  mqSet(pc,'flex','1');
  mqSet('desktop',
    'display','flex',
    'flex-direction','column',
    'flex-wrap','nowrap',
    'justify-content','space-evenly',
    'padding', '0px',
    'margin', '0px');
  mqAppend('desktop',pc);
  plots.push(new Plotter(cfg));
  signalbase.zoomBegin=0;
  signalbase.zoomEnd=signalbase.duration();
 // refreshPlots();
}

function removePlot(cfg) {
  var id = cfg.id;
  var newplots = [];
  for (var i=0;i<plots.length;i++) {
    if (plots[i].id!=id) newplots.push(plots[i]);
  }
  plots = newplots;
  mqDelete(id + '-container');
  signalbase.zoomBegin=0;
  signalbase.zoomEnd=signalbase.duration();
  mqResize();
}

// ------------------
// generic array 

function hover2DSnippet(x) {
  var xsane = x;
  if (Array.isArray(xsane)) xsane=xsane[0];
  var dur = signalbase.duration();
  if (dur==0) return [];
  var ch = hoverInvert?signalbase.curChannelB:signalbase.curChannel;
  var fs = signalbase.data.srates[ch];
  var ofs = xsane-2.5;
  if (ofs<0) ofs=0;
  if (ofs>dur-5.0) ofs=dur-5.0;
  var res = signalbase.chunk(ch,Math.floor(ofs*fs),Math.floor(5.0*fs));
  return res;
}

function hover2D() {
  var xmax = hoverW;
  var ymax = hoverH;
  var data = hover2DSnippet(hoverAt);
  var v = 0;
  var dx = xmax / data.length;
  hoverCtx.fillStyle = '#333';
  hoverCtx.strokeStyle = '#ffffff';
  hoverCtx.fillRect(0, 0, hoverW, hoverH);
  var scale = -0.2;
  v = scale * data[0] + hoverH/2.0;
  hoverCtx.beginPath();
  hoverCtx.moveTo(0, clamp(v, 0, ymax));
  var _js1 = data.length;
  for (var i = 1; i < _js1; i += 1) {
    v = scale * data[i] + hoverH/2.0;
    hoverCtx.lineTo(i * dx, clamp(v, 0, ymax));
  }
  hoverCtx.stroke();
  var ch = hoverInvert?signalbase.curChannelB:signalbase.curChannel;
  var fs = signalbase.data.srates[ch];
  var ofs = Math.round(hoverAt*fs);
  var val = signalbase.data.signals[ch][ofs]||0;
  var str1 = hoverPlot.hhmmss(hoverAt);
  var str2 = val.toFixed(2) + 'uV';
  hoverCtx.font = '12px mqDefault';
  hoverCtx.fillStyle = '#fff';
  hoverCtx.textAlign= 'center';
  hoverCtx.textBaseline= 'middle';
  hoverCtx.fillText(str2,hoverW/2,0.15*hoverH);
  hoverCtx.fillText(str1,hoverW/2,0.9*hoverH);
}

const toDataURL = async (data) =>
  new Promise(ok => {
    const reader = new FileReader();
    reader.addEventListener('load', () => ok(reader.result));
    reader.readAsDataURL(data);
  });

function SVGRender2D (plt,fmax) {
  if (fmax==null) fmax=40;
  var inverted = plt.config['inverted'];
 // var sno = (inverted?signalbase.curChannel:signalbase.curChannelB);
  var sno = (inverted?signalbase.curChannelB:signalbase.curChannel);
  if (mqNaN(signalbase.data.srates[sno])) return;
 // var pal = new mqPalette('Jet'); 
  var fft_size = 1024;
//  var fmax = 40.0;
  var fs = signalbase.data.srates[sno];
  var ny = Math.ceil(fmax*fft_size/fs);
  var nx = plt.pxmax - plt.pxmin;
  var ofs = Math.floor(fs*signalbase.zoomBegin);
  var deltaofs = Math.floor(fs*(signalbase.zoomEnd-signalbase.zoomBegin)/nx);

  var res = [];
  var core2D = plt.config['core2d'];
  if (core2D) res = core2D(plt,sno,fft_size,nx,ofs,deltaofs,ny);
  if (res.length==0) { return; }

  var dx=1;
  var dy=Math.ceil((plt.pymax-plt.pymin)/ny);
  var cw = plt.pxmax-plt.pxmin;
  var ch = plt.pymax-plt.pymin;
  var ch2 = ny*dy;
  if (cw<1||ch2<1) return;
  var canvas = new OffscreenCanvas(cw,ch2);
  var ctx = canvas.getContext('2d');
  var x = 0;
  for (var i=0;i<res.length;++i) {
    for (var j=0;j<res[0].length;++j) {
      //var val = (res[i][j] + 81) / 81;
      var val = res[i][j];
      if (val<0) val=0;
      if (val>1) val=1;
      if (mqNaN(val)) val=0.5;
      var col = palette.rgbstr(val);
      if (col) {
        var y = ch2-dy*(j+1);
        ctx.fillStyle = col;
        ctx.fillRect(x,y,dx,dy);
      }
    }
    x+=dx;
  }
  canvas.convertToBlob().then(function (blob) { return toDataURL(blob) }).then(function (img) {
    plt.draw.image(img).move(plt.pxmin,plt.pymin).attr('height',ch).attr('width',cw).attr('preserveAspectRatio','none');
  });

  // palette
  var palw=10;
  var canvas2 = new OffscreenCanvas(palw,ch2);
  var ctx2 = canvas2.getContext('2d');
  for (var j=0;j<ny;++j) {
    var val = 1.0 - j/(ny-1);
    if (!inverted) val = 1-val;
    var col = palette.rgbstr(val);
    var y = ch2-dy*(j+1);
    ctx2.fillStyle = col;
    ctx2.fillRect(0,y,palw,dy);
  }
  canvas2.convertToBlob().then(function (blob) { return toDataURL(blob) }).then(function (img) {
    plt.draw.image(img).move(plt.pxmax+10,plt.pymin).attr('height',ch).attr('width',palw).attr('preserveAspectRatio','none');
  });

}

// ------------------

class Plotter { 
  constructor (config) {
    var cfg = config||{};
    this.config = cfg;
    this.labels = [];
    this.xs = [];
    this.ys = [];
    this.annotations = [ ];
    this.hemisphere=0;
    this.id = cfg["id"];
    var id = this.id;
    this.onbefore = cfg["onbefore"]||function () {
      hoverHide+=1;
      mqSet(id,'opacity','0.0');
      mqSet(id+'-loading','display','block');
    },
    this.onafter = cfg["onafter"]|| function () {
      mqSet(id,'opacity','1.0');
      mqSet(id+'-loading','display','none');
      hoverHide-=1;
    }
    this.draw = null;
    this.w = 0;
    this.h = 0;
    this.xrange = null;
    this.yrange = null;
    this.needsinit = true;
    this.pxmin = 0;
    this.pxmax = 0;
    this.pymin = 0;
    this.pymax = 0;
    this.xmin = 0;
    this.xmax = 0;
    this.ymin = 0;
    this.ymax = 0;
    this.dragTS = 0;
    this.dragTSLast = 0;
    this.dragBegin=0;
    this.dragEnd=0;
    this.dragBox=null;
    this.hoverValid=false;
    this.hoverTimeout=false;
    this.linestyle = [ '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
    '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'].map(function (x) { 
       return { width: 2, color: x } });
    this.axisFont = { 
      family: 'mqDefault',
      size: 12,
      anchor: 'middle',
    //  startoffset: 1,
      fill: '#000'
    };
    this.annotationFont = {
      family: 'mqDefault',
      size: 10,
      anchor: 'middle',
     // startoffset: 1,
      fill: '#000'
    };
    this.mode = cfg.mode||'trends';
    this.plotTimeout = null;
  }
  init () {
    SVG().addTo('#'+this.id).viewbox(0,0,1,1).size('1','1').attr('preserveAspectRatio','none').attr('id',this.id+'-svg');
    mqEvent(window,'resize',makeSVGResizer(this));
    var id = this.id + '-svg';
    var obj = mqElement(id);
    function moveHandler (evt) {
       evt.preventDefault();
       if (signalbase.duration()==0) return;
       var x = evt.clientX;
       var y = evt.clientY;
       if (mqNaN(x)||mqNaN(y)) return;
       hoverHide=1;
       for (var i=0;i<plots.length;i++) { 
         var obj = mqElement(plots[i].config.id+'-svg');
         if (obj) {
           var rect = obj.getBoundingClientRect();
           var xr = x - rect.left;
           var yr = y - rect.top;
           plots[i].mouseMove(x,y,xr,yr);
         }
       }
    }; 
    function upHandler (evt) {
      evt.preventDefault();
      if (mqNaN(evt.clientX)) return;
      for (var i=0;i<plots.length;i++) plots[i].mouseUp(evt.clientX,(i==0?true:false)); 
    }
    function downHandler (evt) {
      evt.preventDefault();
      var x = evt.clientX;
      var y = evt.clientY;
      if (mqNaN(x)||mqNaN(y)) return;
      for (var i=0;i<plots.length;i++) {
        var obj = mqElement(plots[i].config.id+'-svg');
        if (obj) {
          var rect = obj.getBoundingClientRect();
          var xr = x - rect.left;
          var yr = y - rect.top;
          plots[i].mouseAt(x,y,xr,yr);
        }
        plots[i].mouseDown(x); 
      }
    }
    obj.addEventListener('pointermove',moveHandler);
    obj.addEventListener('pointerdown',downHandler);
    obj.addEventListener('pointerup',upHandler);
    obj.addEventListener('mouseout',function (evt) {
       evt.preventDefault();
       hoverHide=1;
    });
    obj.addEventListener('contextmenu',function (evt) {
       contextMenuUI();
       evt.preventDefault();
    });
    mqSet(obj,'user-select','none');
    mqSet(obj,'touch-action','none');
    //mqStyle(obj,'-webkit-touch-callout','default');
    mqResize();
  }
  mouseAt(x,y,xr,yr) {
    var that = this;
    if (xr>this.pxmin&&xr<this.pxmax&&yr>this.pymin&&yr<this.pymax) {
      this.hoverValid=true;
      if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
      this.hoverTimeout = setTimeout(function () { that.hoverValid=false; },5000);
      hoverHide=0;
      hoverPlot=this;
      hoverX=x; hoverY=y;
      var dur = signalbase.zoomEnd-signalbase.zoomBegin;
      hoverAt=signalbase.zoomBegin + dur*(xr - this.pxmin)/(this.pxmax-this.pxmin);
      hoverAtValue=(this.pymax-yr)/(this.pymax-this.pymin);
    } else {
      this.hoverValid=false;
    } 
  }
  mouseMove(x,y,xr,yr) {
    if (this.dragTS!=0) { 
      hoverHide=1;
      this.dragEnd = x;
      var bw = Math.abs(this.dragEnd-this.dragBegin);
      var bh = this.pymax-this.pymin-2;
      var bx = Math.min(this.dragEnd,this.dragBegin);
      var by = this.pymin+1;
      if (this.dragBox) this.dragBox.remove();
      if (bw>10) {
        this.dragBox = this.draw.rect(0,1,0,1).fill('#ccc').stroke({width: 2, color: '#fff'}).attr('fill-opacity','0.5'); 
        this.dragBox.size(bw,bh).move(bx,by);
      }
    } else {
      this.mouseAt(x,y,xr,yr);
/*
      if (xr>this.pxmin&&xr<this.pxmax&&yr>this.pymin&&yr<this.pymax) {
        hoverHide=0; 
        hoverPlot=this;
        hoverX=x; hoverY=y;
        var dur = signalbase.zoomEnd-signalbase.zoomBegin;
        hoverAt=signalbase.zoomBegin + dur*(xr - this.pxmin)/(this.pxmax-this.pxmin);
        hoverAtValue=(this.pymax-yr)/(this.pymax-this.pymin);
      } 
*/
    }
  }
  mouseUp(x,act) {
    var now = performance.now();
    if (act&&this.dragTS!=0) { 
       if (this.dragTS - this.dragTSLast <700) {
         signalbase.zoomBegin=0;
         signalbase.zoomEnd=signalbase.duration(); 
         hoverHide=1;
         mqResize();
       } else if (Math.abs(this.dragEnd-this.dragBegin)>10) {
         var z1 = (Math.min(this.dragBegin,this.dragEnd)-this.pxmin)/(this.pxmax-this.pxmin);
         var z2 = (Math.max(this.dragBegin,this.dragEnd)-this.pxmin)/(this.pxmax-this.pxmin);
         if (z1<0) z1=0;
         if (z2>1) z2=1;
         if (z1>=0&&z2>z1&&z2<=1) { 
           var dur = signalbase.zoomEnd - signalbase.zoomBegin;
           var zb = Math.floor(signalbase.zoomBegin + z1*dur);
           var ze = Math.floor(signalbase.zoomBegin + z2*dur);
           var sep = Math.abs(ze-zb);
           if (sep<60) {
             var tmp = Math.round((60-sep)/2.0);
             zb-=tmp;
             ze+=tmp; 
           }
           if (zb<0) zb=0;
           if (ze>signalbase.duration()) ze=signalbase.duration();
           signalbase.zoomBegin = zb;
           signalbase.zoomEnd = ze;
           hoverHide=1;
           mqResize();
         }
      }
    }
    if (this.dragBox) {
      this.dragBox.remove();
      this.dragBox=null;
    }
    this.dragTSLast = this.dragTS;
    this.dragTS=0;
  }
  mouseDown(x) {
    this.dragTS = performance.now();
    this.dragBegin = x;
    this.dragEnd = x;
  }
  annotations_match (t1,t2) {
    var dur_min = signalbase.duration()/60.0;
    var dm = 0.005*dur_min;
    return (Math.abs(t1-t2)<dm?true:false);
  }
  annotate (x,label) {
    var xsane = x;
    if (Array.isArray(xsane)) xsane=x[0];
    if (label.length>0) {
      var found = false;
      for (i=0;i<this.annotations.length;++i) {
        if (this.annotations_match(xsane,this.annotations[i][0])) {
          this.annotations[i][1]=label;
          found=true;
        }
      }
      if (!found) this.annotations.push([xsane,label]);
    } else {
      var tmp = [];
      for (i=0;i<this.annotations.length;++i) {
        if (!this.annotations_match(xsane,this.annotations[i][0])) tmp.push(this.annotations[i]);
      }
      this.annotations = tmp;
    }
    hoverAt=null;
    elementContent(this.id,"");
    this.plot();
  }
  getAnnotation (x) {
    var res = "";
    var xsane = x;
    if (Array.isArray(xsane)) xsane=x[0];
    for (i=0;i<this.annotations.length;++i) {
      if (this.annotations_match(xsane,this.annotations[i][0])) {
        res = this.annotations[i][1];
      }
    }
    return res;
  }
  hhmmss (ofs) {
    var timestamp = signalbase.data.starttime.split(".").map(parseFloat);
    for (var i=0;i<ofs;i++) {
      timestamp[2]+=1;
      if (timestamp[2]>=60) { timestamp[2]-=60; timestamp[1]+=1; }
      if (timestamp[1]>=60) { timestamp[1]-=60; timestamp[0]+=1; }
      if (timestamp[0]>=24) { timestamp[0]-=24; }
    }
    var h = Math.floor(timestamp[0]).toString();
    var m = Math.floor(timestamp[1]).toString();
    var s = Math.floor(timestamp[2]).toString();
    if (h.length==1) h="0" + h;
    if (m.length==1) m="0" + m;
    if (s.length==1) s="0" + s;
    return h+":"+m+":"+s;   
  } 
  populate_annotations() {
    var drug = this.id.slice(8);
    this.annotations=[];
    for (var i=0;i<signalbase.data.annotations.length;++i) {
      var xpos = signalbase.data.annotations[i][0];
      var label = signalbase.data.annotations[i][2];
      if (label.includes('^')) {
        var tmp = label.split(',');
        var tmp2 = [];
        for (var j=0;j<tmp.length;j++) {
          if (tmp[j].includes(drug)) { 
            tmp2.push(tmp[j].split('^')[0]);
          }
        }
        label=tmp2.join(',');
      }
      if (label!="") this.annotations.push( [xpos,label]);
    }
  }
  plot_annotations() {
   var s = { width: 1, color: '#000' };
   //var dur = signalbase.duration();
   var dur = signalbase.zoomEnd - signalbase.zoomBegin;
   var ofs = signalbase.zoomBegin;
   for (var i=0;i<this.annotations.length;i++) {
      var t = this.annotations[i][0];
      var label = this.annotations[i][1];
      var x = this.pxmin+((t-ofs)/dur)*(this.pxmax-this.pxmin);
      var y = this.pymin-25;
      if (x>this.pxmin&&x<this.pxmax) {
        this.draw.plain(label).move(x,y).font(this.annotationFont);
        //this.draw.line(x,this.pymin,x,this.pymin-5).stroke(s);
        this.draw.polygon([x,this.pymin,x+4,this.pymin-5,x-4,this.pymin-5]).fill('#000');
      }
   }
  }
  plot_frame() {
    var s = { width: 1, color: '#000' };
    this.draw.line(this.pxmin,this.pymin,this.pxmin,this.pymax).stroke(s);
    this.draw.line(this.pxmax,this.pymin,this.pxmax,this.pymax).stroke(s);
    this.draw.line(this.pxmin,this.pymin,this.pxmax,this.pymin).stroke(s);
    this.draw.line(this.pxmin,this.pymax,this.pxmax,this.pymax).stroke(s);
    var dur = signalbase.zoomEnd - signalbase.zoomBegin;
    if (dur==0) { 
      return;
    }
    var ofs = signalbase.zoomBegin;
    for (var i=0;i<5;i++) {
      var y = this.pymax;
      var x = this.pxmin+i*(this.pxmax-this.pxmin)/4;
      this.draw.plain(this.hhmmss(ofs)).move(x,y).font(this.axisFont);
      this.draw.line(x,y,x,y+5).stroke(s);
      ofs += dur/4;
    }
    var title = this.config.renderLabel(this);
    this.draw.plain(title).move(15,this.h/2.0-10).font(this.axisFont).rotate(-90);
    if (this.config.ylabelmin) {
      var str = this.config.ylabelmin;
      var y = (this.config.inverted?10:this.h-37);
      this.draw.plain(str).move(15,y).font(this.annotationFont);
    }
    if (this.config.ylabelmax) {
      var str = this.config.ylabelmax;
      var y = (this.config.inverted?this.h-37:10);
      this.draw.plain(str).move(15,y).font(this.annotationFont);
    }
  }
  plot_marker() {
    var s = { width: 1, color: '#000' };
    var x = this.pxmin;
    this.markerLine = this.draw.line(this.pxmin,this.pymin,this.pxmin,this.pymax).stroke(s);
    //this.markerArrow = this.draw.polygon([x,this.pymax,x+4,this.pymax+5,x-4,this.pymax+5]).fill('#000');
    //this.markerArrow = this.draw.circle(6).move(this.pymax,x).fill("#fff").stroke(s);
    this.markerArrow = this.draw.circle(6).move(0,-12).fill("#fff").stroke(s);
  }
  plot_hover_line() {
    var s = { width: 1, color: '#ccc' };
    this.hoverLine = this.draw.line(this.pxmin,this.pymin,this.pxmin,this.pymax).stroke(s);
  }
  hover(pos) {
    var x = (this.pxmax-this.pxmin)*pos+this.pxmin;
    if (this.hoverLine) this.hoverLine.move(x,this.pymin);
  }
  mark (pos) { 
    var x = (this.pxmax-this.pxmin)*pos+this.pxmin;
    if (this.markerLine) this.markerLine.move(x,this.pymin);
    //if (this.markerArrow) this.markerArrow.move(x-4,this.pymax);
    if (this.markerArrow) this.markerArrow.move(x-3,this.pymax);
  }
  plot_internal () {
    if (this.needsinit) { this.needsinit=false; this.init(); }
    var id = this.id + '-svg';
    var obj = mqElement(id);
    if (obj==null) return;
    this.populate_annotations();
    this.w = parseInt(mqAttr(obj,'width'));
    this.h = parseInt(mqAttr(obj,'height'));
    this.pxmin = 30;
    this.pxmax = this.w-30;
    this.pymin = 20;
    this.pymax = this.h-20;
    obj.innerHTML="";
    this.draw = SVG('#'+id);
    var render = plotters[this.mode];
    if (render!=null) render(this); 
    this.plot_hover_line();
    this.plot_marker();
    this.plot_annotations();
    this.plot_frame();
    if (this.dragBox) this.dragBox.remove();
    this.dragBox=null;
    if (this.onafter) this.onafter();
  }
  plot () {
    if (this.onbefore) this.onbefore();
    var that = this;
    if (this.plotTimeout) clearTimeout(this.plotTimeout);
    this.plotTimeout = setTimeout( function () { that.plot_internal(); }, 100.0);
  }
}

function makePlotterCB(cfg) {
  return function () {
    var lbl = cfg.label;
    var sel = desktop.menubar.getSubmenu('mb-plotters',lbl)[2]||false;
    if (sel) {
      var match = false;
      for (var i=0;i<plots.length;i++) {
        if (plots[i].config["id"]==cfg.id) match=true;
      }
      if (match) removePlot(cfg);
      desktop.menubar.checkSubmenu('mb-plotters',lbl,false);
    } else {
      addPlot(cfg);
      desktop.menubar.checkSubmenu('mb-plotters',lbl);
    }
  };
}

function addPlotter(cfg) {
  plotters[cfg.mode]=cfg.render;
  var entries=desktop.menubar.getSubmenus('mb-plotters');
  var exists = false;
  for (var i=0;i<entries.length;i++) {
    if (entries[i][0]==cfg.label) {
      entries[i][1] = makePlotterCB(cfg);
      entries[i][2] = cfg.default?true:false;
      exists=true;
    }
  }
  if (!exists) entries.push([cfg.label, makePlotterCB(cfg),cfg.default?true:false]);
  entries.sort(function (a,b) {
    return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
  });
  desktop.menubar.setSubmenus('mb-plotters',entries);
  if (cfg.default) { addPlot(cfg); }
}

var dragPlotFromN,dragPlotToN;
var dragPlotFromX,dragPlotToX;

function dragPlotBegin (evt) {
  var x = evt.clientX;
  var y = evt.clientY;
  if (mqNaN(x)||mqNaN(y)) return;
  var rect = this.getBoundingClientRect();
  dragPlotFromX = x - rect.left;
  dragPlotFromN = Math.floor(plots.length*(y - rect.top )/rect.height);
}

function dragPlotMove (evt) {
  var x = evt.clientX;
  var y = evt.clientY;
  if (mqNaN(x)||mqNaN(y)) return;
  if (mqNaN(dragPlotFromN)) return;
  var rect = this.getBoundingClientRect();
  var tmpX = x - rect.left;
  var tmpN = Math.floor(plots.length*(y - rect.top )/rect.height);
  mqSet(this,'cursor',(Math.abs(tmpX-dragPlotFromX)<=10&&tmpN!=dragPlotFromN?'grab':'default'));
}

function dragPlotEnd (evt) {
  mqSet(this,'cursor','default');
  var x = evt.clientX;
  var y = evt.clientY;
  if (mqNaN(x)||mqNaN(y)) return;
  var rect = this.getBoundingClientRect();
  var xr = x - rect.left;
  var yr = ( y - rect.top ) / rect.height;
  dragPlotToX = x - rect.left;
  dragPlotToN = Math.floor(plots.length*(y - rect.top )/rect.height);
  if (Math.abs(dragPlotToX-dragPlotFromX)<=10&&dragPlotFromN!=dragPlotToN) {
    var e1 = this.children[dragPlotFromN];
    if (dragPlotFromN>dragPlotToN) {
      for (var i=dragPlotFromN-1;i>=dragPlotToN;i--) {
        var e2 = this.children[i];
        e1.after(e2);
      } 
    } else { 
      for (var i=dragPlotFromN+1;i<=dragPlotToN;i++) {
        var e2 = this.children[i];
        e1.before(e2);
      }
    }
    refreshPlots();
  }
  dragPlotFromN=null;
}

function initPlotters () {
  var obj = mqElement("desktop");
  obj.addEventListener('pointerdown',dragPlotBegin);
  obj.addEventListener('pointermove',dragPlotMove);
  obj.addEventListener('pointerup',dragPlotEnd);
  mqAjaxJSDir(mqVersion+'/plotters');
}

