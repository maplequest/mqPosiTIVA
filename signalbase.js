var signalbase;

class SignalBase {
  constructor(config) {
    var cfg = config || {};
    this.version="1.0.0";
    this.clear();
    this.onbeforeload = cfg["onbeforeload"]||function(){};
    this.onafterload = cfg["onafterload"]||function(){};
    this.onchange = cfg["onchange"]||function(){};
    this.curChannel = 0;
    this.curChannelB = 0;
    this.zoomBegin=0;
    this.zoomEnd=0;
    this.eegSitesBipolar = [
      'FP9 FP10 AF9 AF10 F9 F10 FT9 FT10 T9 T10 TP9 TP10 P9 P10 PO9 PO10 O9 O10',
      'FP1 FP2 AF7 AF8 F7 F8 FT7 FT8 T7 T8 TP7 TP8 P7 P8 PO7 PO8 O1 O2',
      'A1 A2', 'AF3 AF4', 'F5 F6 F3 F4 F1 F2', 'FC5 FC6 FC3 FC4 FC1 FC2',
      'C5 C6 C3 C4 C1 C2', 'CP5 CP6 CP3 CP4 CP1 CP2', 'P5 P6 P3 P4 P1 P2', 'PO3 PO4',
      'EEG1 EEG2', 'EEG3 EEG4'
    ].map(function(str) { return str.split(' '); }).flat();
    this.eegSitesUnipolar = [
      'NZ FPZ AFZ FZ FCZ CZ CPZ PZ POZ OZ IZ'
    ].map(function(str) { return str.split(' '); }).flat();
  }
  mirrorChannel (ch) {
    var res = ch;
    var mir = null;
    var match=null;
    var lbl = this.data.labels[ch].toUpperCase();
    for (var i=0;i<this.eegSitesBipolar.length;i++) {
      if (lbl.includes(this.eegSitesBipolar[i])) { 
        match=this.eegSitesBipolar[i];
        mir=this.eegSitesBipolar[i%2==0?i+1:i-1];
        break;
      }
    }
    if (mir) {
      // try an exact match first
      var mirlbl=lbl.replace(match,mir);
      for (var i=0;i<this.data.labels.length;i++) {
        if (this.data.labels[i].toUpperCase()==mirlbl) { 
          res=i; 
          break; 
        }
      }
      if (res==ch) {
        // exact mirror did not work... fall back on partial match
        for (var i=0;i<this.data.labels.length;i++) {
          var lbl2=this.data.labels[i].toUpperCase();
          if (lbl.length==lbl2.length&&lbl2.includes(mir)) {
            res=i;
            break;
          }
        }
      }
    }
    return res;
  }
  setCurChannel(i) {
    this.curChannel = i;
    this.curChannelB = this.mirrorChannel(i);
  }
  isEEG(i) {
    var res = false;
    var sr = this.data.srates[i];
    if (sr<128) return false;
    var lbl = this.data.labels[i].toUpperCase();
    for (var i=0;i<this.eegSitesBipolar.length;i++) {
      if (lbl.includes(this.eegSitesBipolar[i])) { res=true; break; }
    }
    return res;
  }
  isTrend(i) {
    return (this.data.srates[i]==1?true:false);
  }
  // note: this does not handle midnight rollover
  // 2014-06-24 14:56:05 -> secs
  timestampToSec (ts) {
    var t1a = this.data.starttime.split(".").map(parseFloat);
    var t2a = ts.split(" ")[1].split(":").map(parseFloat);
    var t1 = t1a[0]*3600+t1a[1]*60+t1a[2];
    var t2 = t2a[0]*3600+t2a[1]*60+t2a[2];
    return t2-t1;
  }
  // note: this does not handle midnight rollover 
  // secs -> 2014-06-24 14:56:05 
  secToTimestamp (ofs_sec) {
    var startdate = "20" + this.data.startdate.split(".").reverse().join("-") + " ";
    var timestamp = this.data.starttime.split(".").map(parseFloat);
    timestamp[2]+=ofs_sec;
    while (timestamp[2]>=60) {
      timestamp[2]-=60;
      timestamp[1]+=1;
    }
    while (timestamp[1]>=60) {
      timestamp[1]-=60;
      timestamp[0]+=1;
    }
    if (timestamp[0]>=24) { timestamp[0]-=24; }
    var h = Math.floor(timestamp[0]).toString();
    var m = Math.floor(timestamp[1]).toString();
    var s = Math.floor(timestamp[2]).toString();
    if (h.length==1) h="0" + h;
    if (m.length==1) m="0" + m;
    if (s.length==1) s="0" + s;
    return startdate+h+":"+m+":"+s;
  }
  clear () {
    this.data = {
      signals: [],
      labels: [],
      srates: [],
      dims: [],
      annotations: [],
      bits: [],
      resolution: []
    };
    this.append = false;
    this.record = false;
    this.curChannel = 0;
    this.curChannelB = 0;
  }
  trim (t1,t2) {
    var dur = this.duration();
    if (t1==0&&t2==dur||t2<=t1) return;
    if (t1<0) t1=0;
    if (t2>dur) t2=dur;
    var ts = this.secToTimestamp(t1);
    var newdate = ts.split(' ')[0].slice(2).replace(/-/g,'.');
    var newtime = ts.split(' ')[1].replace(/:/g,'.');
    for (var i=0;i<this.data.signals.length;i++) {
      var fs = this.data.srates[i];
      var ofs = Math.floor(t1*fs);
      var dur = Math.floor((t2-t1)*fs);
      this.data.signals[i].splice(0,ofs);
      var len = this.data.signals[i].length;
      this.data.signals[i].splice(dur,len-dur);
    }
    var newannotations = [];
    for (var i=0;i<this.data.annotations.length;i++) {
      var ofs = this.data.annotations[i][0];
      var dur = this.data.annotations[i][1];
      var str = this.data.annotations[i][2];
      if (ofs>=t1&&ofs<=t2) newannotations.push([ofs-t1,dur,str]);
    }
    this.data.annotations = newannotations;
    this.data.starttime = newtime;
    this.data.startdate = newdate;
    this.zoomBegin = 0;
    this.zoomEnd = this.duration();
  }
  cut (t1,t2) {
    var dur = this.duration();
    if (t1==0&&t2==dur||t2<=t1) return;
    if (t1<0) t1=0;
    if (t2>dur) t2=dur;
    for (var i=0;i<this.data.signals.length;i++) {
      var fs = this.data.srates[i];
      var ofs = Math.floor(t1*fs);
      var len = Math.floor((t2-t1)*fs);
      this.data.signals[i].splice(ofs,len);
    }
    var newannotations = [];
    for (var i=0;i<this.data.annotations.length;i++) {
      var ofs = this.data.annotations[i][0];
      var dur = this.data.annotations[i][1];
      var str = this.data.annotations[i][2];
      if (ofs<t1) newannotations.push([ofs,dur,str]);
      if (ofs>t2) newannotations.push([ofs-(t2-t1),dur,str]);
    }
    this.data.annotations = newannotations;
    this.zoomBegin = 0;
    this.zoomEnd = this.duration();
  }
  create (label,srate,dimstr) {
    if (!this.data.labels.includes(label)) {
      var dim = dimstr||"a.u.";
      var n = (this.data.signals.length==0?0:
        Math.ceil((srate*this.data.signals[0].length)/this.data.srates[0]));
      this.data.signals.push(Array(n).fill(0));
      this.data.labels.push(label);
      this.data.srates.push(srate);
      this.data.dims.push(dim);
      this.data.bits.push(16);
      this.data.resolution.push(0);
    }
  }
  setvalue(label,idx,value) {
    for (var i=0;i<this.data.labels.length;i++) {
      if (this.data.labels[i]==label) {
        if (idx>=0&&idx<this.data.signals[i].length) {
          this.data.signals[i][idx]=value||0;
        }
      }
    }
  }
  pushvalue(label,value) {
    for (var i=0;i<this.data.labels.length;i++) {
      if (this.data.labels[i]==label) {
        if (Array.isArray(value)) {
          for (var j=0;j<value.length;j++) {
            if (!mqNaN(value[j])) this.data.signals[i].push(value[j]||0);
          }
        } else {
            if (!mqNaN(value)) this.data.signals[i].push(value||0);
        }
      }
    }
  }
  deleteSignal(label,ignorechange) {
    var idx=-1;
    for (var i=0;i<this.data.signals.length;i++) {
      if (label==this.data.labels[i]) { idx=i; break; }
    }
    if (idx>=0) {
      this.data.signals.splice(idx,1);
      this.data.labels.splice(idx,1);
      this.data.srates.splice(idx,1);
      this.data.dims.splice(idx,1);
      this.data.bits.splice(idx,1);
      this.data.resolution.splice(idx,1);
    }
    if (ignorechange==null) this.onchange();
  }
  delete (rgx,keep) {
    var toDelete=[];
    for (var i=0;i<this.data.signals.length;i++) {
      if (!keep) {
        if (this.data.labels[i].match(rgx)&&!this.isEEG(i)) 
          toDelete.push(this.data.labels[i]);
      } else {
        if (!this.data.labels[i].match(rgx)&&!this.isEEG(i)) 
          toDelete.push(this.data.labels[i]);
      }
    }
    for (var i=0;i<toDelete.length;i++) this.deleteSignal(toDelete[i],true);
    this.onchange();
  }
  keep (rgx) {
    this.delete(rgx,true);
  }
  deleteAnnotation(label,ignorechange) {
    var idx=-1;
    for (var i=0;i<this.data.annotations.length;i++) {
      var ann = this.data.annotations[i];
      if (label==ann[2]) { idx=i; break; }
    }
    if (idx>=0) {
      this.data.annotations.splice(idx,1);
    }
    if (ignorechange==null) this.onchange();
  }
  deleteAnnotationRegex (rgx) {
    var toDelete=[];
    for (var i=0;i<this.data.annotations.length;i++) {
      var ann = this.data.annotations[i];
      if (ann[2].match(rgx)) toDelete.push(ann[2]);
    }
    for (var i=0;i<toDelete.length;i++) this.deleteAnnotation(toDelete[i],true);
    this.onchange();
  }
  duration () {
    var res = 0;
    if (this.data.signals.length>0) {
       res = this.data.signals[0].length / this.data.srates[0];
    }
    return res;
  } 
  chunk(idx,ofs,len) {
    return this.data.signals[idx].slice(ofs,ofs+len);
  }
  trendChannels () {
    var res = [];
    for (var i=0;i<this.data.srates.length;i++) {
      if (this.isTrend(i)) res.push(i);
    }
    return res;
  }
  eegChannels () {
    var res = [];
    for (var i=0;i<this.data.srates.length;i++) {
      if (this.isEEG(i)) res.push(i);
    }
    return res;
  }
  waveformChannels () {
    var res = [];
    for (var i=0;i<this.data.srates.length;i++) {
      if (!this.isTrend(i)) res.push(i);
    }
    return res;
  }
  // --------------------------
  stringFromArraybuffer(data) {
    if (typeof data === 'string') {
      return data;
    } else {
      var strdata = '';
      var ua = new Uint8Array(data);
      for (var i=0;i<ua.length;i+= 1) {
        strdata += String.fromCharCode(ua[i]);
      }
      return strdata;
    }
  }
  saveFile(data, filename) {
    if (window.navigator.msSaveOrOpenBlob) {
      return window.navigator.msSaveOrOpenBlob(data, filename);
    } else {
      var a = document.createElement('a');
      a.style.display='none';
      var url = window.URL.createObjectURL(new Blob([data],{
          //'type': 'text/plain'
          'type': 'application/octet-stream'
      }));
      document.body.appendChild(a);
      a.href = url;
      a.download = filename;
      a.click();
      return setTimeout(function() {
          window.URL.revokeObjectURL(url);
          return document.body.removeChild(a);
      }, 0);
    };
  }
  loadFile(handler) {
    this.curChannel = 0;
    this.curChannelB = 0;
    var frm = document.createElement('form');
    frm.style.display='none';
    frm.id = 'temp-load-file';
    frm.innerHTML = '<input id=\'temp-load-file-input\' type=\'file\'>';
    document.body.append(frm);
    document.getElementById('temp-load-file-input').onchange = function(e) {
      var files = e.target.files;
      if (files) {
        var reader = new FileReader();
        var fname = files[0].name;
        reader.onload = function(e) {
          var res = e.target.result;
          handler(fname, res);
          return document.body.removeChild(document.getElementById('temp-load-file'));
        }
        return reader.readAsArrayBuffer(files[0]);
      }
    }
    return document.getElementById('temp-load-file-input').click();
  }
  // --------------------------
  start() {
    this.clear();
    this.append=false;
    this.record = true;
    var d = new Date();
    this.data.startdate= 
      ("0" + d.getDate()).slice(-2) + "." + 
      ("0"+(d.getMonth()+1)).slice(-2) + "." +
      ("0"+d.getFullYear()).slice(-2);
    this.data.starttime= 
      ("0" + d.getHours()).slice(-2) + "." + 
      ("0" + d.getMinutes()).slice(-2) + "." +
      ("0" + d.getSeconds()).slice(-2);
    this.data.d = d;
    this.data.filename="output.edf";
  }
  stop () {
    var d = new Date();
    var elapsed = (d.getTime() - this.data.d.getTime())/1000.0;
    for (var i=0;i<this.data.signals.length;i++) {
      this.data.srates[i]=Math.round(this.data.signals[i].length/elapsed);
    }
    this.record = false;
  }
  write(lbl,value,unit) {
    if (value==null||!this.record) return;
    var j = -1;
    for (var i = 0;i<this.data.signals.length;i++) {
      if (lbl==this.data.labels[i]) { j=i; break; }
    }
    if (unit==null) unit="units";
    if (j==-1) {
      j=this.data.signals.length;
      this.data.signals.push([]);
      this.data.dims.push(unit);
      this.data.labels.push(lbl);
      this.data.srates.push(0);
      this.data.bits.push(16);
      this.data.resolution.push(0);
    }
  //  if (!Array.isArray(this.data.signals)) {
  //    this.data.signals=[];
  //  }
  //  for (var i=this.data.signals.length;i<=j;i++) {
  //    this.data.signals.push([]);
  //  }
    if (Array.isArray(value)) {
      for (var i=0;i<value.length;i++) {
        if (!mqNaN(value[i])) this.data.signals[j].push(value[i]||0);
      }
    } else {
      if (!mqNaN(value)) this.data.signals[j].push(value||0);
    }
  }
  annotate(label,ofs,dur) {
    //if (!this.record||typeof label != "string"||label.length==0) return;
    if (typeof label != "string"||label.length==0) return;
    if (ofs==null) {
      var d = new Date();
      ofs = Math.round((d.getTime()-this.data.d.getTime())/1000.0);
    }
    if (dur==null) dur=0; else dur = Math.round(dur);
    this.data.annotations.push([ofs, dur, label]);
  }
  sanitizeAnnotations () {
    var anew=[];
    var apos=[];
    var n = this.data.annotations.length;
    for (var i=0;i<n;i++) {
      var an = this.data.annotations[i];
      if (an[0]>this.zoomBegin&&an[0]<this.zoomEnd&&!apos.includes(an[0])) {
        anew.push(an);
        apos.push(an[0]);
      }
    }
    if (anew.length>0) {
      anew.sort(function(a,b) { return a[0]- b[0]; });
    }
    this.data.annotations = anew;
  }
  saveJSON(fname) {
    this.data.filename=fname;
    this.saveFile(JSON.stringify(this.data),fname);
  }
  // --------------------------
  read(j) {
    if (typeof j == "string") {
      for (var i = 0;i<this.data.signals.length;i++) {
        if (j==this.data.labels[i]) { j=i; break; }
      }
    }
    if (j>=this.data.signals[j].length) return undefined;
    return this.data.signals[j].shift();
  }
  loadJSON() {
    var that = this;
    that.onbeforeload();
    this.loadFile(function (fname,data) {
      that.data = JSON.parse(that.stringFromArraybuffer(data));
      that.data.filename=fname;
      that.zoomBegin=0;
      that.zoomEnd=that.duration();
    });
  }
  // --------------------------
  read_int (abdata) {
    return parseInt(this.stringFromArraybuffer(abdata),10);
  };
  read_float (abdata) {
    return parseFloat(this.stringFromArraybuffer(abdata));
  };
  read_string (abdata) {
    return this.stringFromArraybuffer(abdata);
  };
  loadEDFData(fname,data) {
    var that = this;
//  if (!Array.isArray(that.data.signals)) {
//    that.data.signals=[];
//  }  
    if (that.data.signals.length==0) that.append=false;
//  if (!that.append) that.data.annotations=[];
    if (!that.append) that.clear();
    this.curChannel = 0;
    this.curChannelB = 0;
    that.record=true;
    var ofs = (that.append?Math.floor(that.data.signals[0].length/that.data.srates[0]):0);
    var idx= 8 + // version
             80 +  // patient
             80;   // recording
    if (!that.append) that.data.startdate = that.read_string(data.slice(idx,idx+8));
    idx+=8;
    if (!that.append) that.data.starttime = that.read_string(data.slice(idx,idx+8));
    idx+=8;
    idx+=  8  +  // bytes in header
           44;   // reserved
    var rn = that.read_int(data.slice(idx,idx+8));
    idx+=8;
    var rt = that.read_float(data.slice(idx,idx+8));
    idx+=8;
    var n = that.read_int(data.slice(idx,idx+4));
    if (that.append&&n!=that.data.signals.length) {
      console.error("Signal mismatch, cannot append EDF.");
      return;
    }
    idx+=4;
    that.data.labels=[];
    for (var i=0;i<n;i++) {
      var label = that.read_string(data.slice(idx,idx+16));
      that.data.labels.push(label.trim());
      idx+=16;
    }
    idx+= n*80; // transducer types
    that.data.dims=[];
    for (var i=0;i<n;i++) {
      var dim = that.read_string(data.slice(idx,idx+8));
      that.data.dims.push(dim.trim());
      idx+=8;
    }
    var physmin=[];
    for (var i=0;i<n;i++) {
      physmin.push(that.read_float(data.slice(idx,idx+8)));
      idx+=8;
    }
    var physmax=[];
    for (var i=0;i<n;i++) {
      physmax.push(that.read_float(data.slice(idx,idx+8)));
      idx+=8;
    }
    var digmin=[];
    for (var i=0;i<n;i++) {
      digmin.push(that.read_float(data.slice(idx,idx+8)));
      idx+=8;
    }
    var digmax=[];
    for (var i=0;i<n;i++) {
      digmax.push(that.read_float(data.slice(idx,idx+8)));
      idx+=8;
    }
    that.data.bits = [];
    that.data.resolution = [];
    for (var i=0;i<n;i++) {
      var drange = digmax[i]-digmin[i];
      var arange = physmax[i]-physmin[i];
      that.data.bits[i]=Math.log2(drange);
      that.data.resolution[i]=arange/drange;
    }
    idx+=n*80; // prefiltering
    var rsamples=[];
    var rstride=0;
    that.data.srates=[];
    for (var i=0;i<n;i++) {
      var tmp = that.read_int(data.slice(idx,idx+8));
      that.data.srates.push(tmp/rt);
      rsamples.push(tmp);
      rstride+=tmp;
      idx+=8;
    }
    idx+=n*32; // reserved
    var s16data = new Int16Array(data.slice(idx,data.length));
    for (var sno=0;sno<n;sno++) {
      if (!that.append) that.data.signals[sno]=[];
      var len = rn * rsamples[sno];
      if (that.data.labels[sno]=="EDF Annotations") {
        var ann_state = 0;
        var ann_fragment=["","",""];
        for (var sidx=0;sidx<len;sidx++) {
          var rno = Math.floor(sidx/rsamples[sno]);
          idx = rno*rstride;
          for (var i=0;i<sno;i++) { idx+=rsamples[i]; }
          idx+=sidx-rno*rsamples[sno];
          var sample = s16data[idx];
          for (const c of [(sample&0xff),((sample>>8)&0xff)] ) {
            if (c==0) { 
              if (ann_fragment[2].length>0) {
                var tmp = parseFloat(ann_fragment[0])+ofs;
                var dur = (ann_fragment[1].length>0?parseFloat(ann_fragment[1]):0);
                that.annotate(ann_fragment[2],tmp,dur);
              }
              ann_state = 0;
              ann_fragment=["","",""];
            } else if (c==21) {
              ann_state = 1;
            } else if (c==20) {
              ann_state = 2; 
            } else {
              if (c>=32&&c<=127) ann_fragment[ann_state]+=String.fromCharCode(c);
            }
          }
          that.data.signals[sno].push(sample);
        }
      } else {
        for (var sidx=0;sidx<len;sidx++) {
          var rno = Math.floor(sidx/rsamples[sno]);
          idx = rno*rstride;
          for (var i=0;i<sno;i++) { idx+=rsamples[i]; }
          idx+=sidx-rno*rsamples[sno];
          var sample = s16data[idx];
          sample += -1.0*digmin[sno];
          sample *= (physmax[sno]-physmin[sno])/(digmax[sno]-digmin[sno]);
          sample += 1.0*physmin[sno];
          that.data.signals[sno].push(sample);
        }
      }
    }
    if (!that.append) that.data.filename=fname;
    that.append = false;
    that.deleteSignal("EDF Annotations",true);
    that.deleteSignal("Flags",true);
    that.delete(/Reserved/);
    // remove excessive number of annotations 
    if (that.data.annotations.length>100) {
      that.data.annotations = [ ];
    }
    // @@ that.setCurChannel(that.eegChannels[0]);
    that.record=false;
    that.zoomBegin=0;
    that.zoomEnd=that.duration();
    that.sanitizeAnnotations();
    that.onafterload();
    that.onchange();
  }
  loadEDF() {
    this.append = false;
    var that = this;
    this.loadFile(function (fname,data) {
      console.log('Loading ' + fname);
      that.loadEDFData(fname,data);
    });
  }
  appendEDF() {
    this.append = true;
    var that = this;
    this.loadFile(function (fname,data) {
      console.log('Appending ' + fname);
      that.loadEDFData(fname,data);
    });
  }
  // --------------------------
  write_int (buf,ofs,value,pmin,pmax) {
    var tmp = Math.floor((65535*(value-pmin))/(pmax-pmin)-32768);
    buf[ofs]=tmp&0xff;
    buf[ofs+1]=(tmp>>8)&0xff;
    return ofs + 2;
  }
  write_stringpad (buf,ofs,str,len) {
    for (var i=0;i<len;i++) {
      buf[ofs+i]=(i<str.length?str.charCodeAt(i):32);
    }
    return ofs + len;
  }
  write_annotation (ann) {
    var str = "+" + ann[0] + "|" + (ann[1]==0?"":ann[1]) + "|" + ann[2];
    var tmp = str.split("|");
    var bytes = [];
    for (var i=0;i<tmp[0].length;i++) {
      bytes.push(tmp[0].charCodeAt(i));
    }
    if (tmp[1].length>0) {
      bytes.push(21);
      for (var i=0;i<tmp[1].length;i++) {
        bytes.push(tmp[1].charCodeAt(i));
      }
    }
    bytes.push(20);
    for (var i=0;i<tmp[2].length;i++) {
      bytes.push(tmp[2].charCodeAt(i));
    }
    bytes.push(20);
    bytes.push(0);
    if (bytes.length%2!=0) bytes.push(0);
    var words = [];
    for (var i=0;i<bytes.length/2;i++) {
      words.push(bytes[2*i]+bytes[2*i+1]*256);
    }
    return words;
  }
  saveEDF() {
    var aidx = -1;
    this.record=true;
    if (this.data.annotations.length>0) {
      for (var i=0;i<this.data.annotations.length;i++) {
        var tmp = this.write_annotation(this.data.annotations[i]);
        this.write("EDF Annotations",tmp);
      }
      aidx = this.data.signals.length-1;
      var dur = Math.ceil(this.data.signals[0].length/this.data.srates[0]);
      this.data.srates[aidx] = Math.ceil(this.data.signals[aidx].length/dur);
    }
    var ns = this.data.signals.length;
    if (ns==0) return;
    var nheader = 8+80+80+8+8+8+44+8+8+4+ns*(16+80+8+8+8+8+8+8+80+8+32);
    var nsamples = 0;
    for (var i=0;i<ns;i++) { nsamples+=2*this.data.signals[i].length; }
    var rt = 1;
    var rn = Math.ceil(this.data.signals[0].length/(rt*this.data.srates[0]));
    var nr = [];
    for (var i=0;i<ns;i++) {
      nr.push(Math.floor(this.data.srates[i]*rt));
    }
    var ntotal = nheader + nsamples;
    var abdata = new ArrayBuffer(ntotal);
    var abview = new Uint8Array(abdata);
    for (var i=0;i<ntotal;i++) abview[i]=0;
    var idx=0;
    idx = this.write_stringpad(abview,idx,"0",8);
    idx = this.write_stringpad(abview,idx,"",80);
    idx = this.write_stringpad(abview,idx,"",80);
    idx = this.write_stringpad(abview,idx,this.data.startdate,8);
    idx = this.write_stringpad(abview,idx,this.data.starttime,8);
    idx = this.write_stringpad(abview,idx,nheader+"",8);
    idx = this.write_stringpad(abview,idx,"",44);
    idx = this.write_stringpad(abview,idx,rn+"",8);
    idx = this.write_stringpad(abview,idx,rt+"",8);
    idx = this.write_stringpad(abview,idx,ns+"",4);
    for (var i=0;i<ns;i++) {
      idx = this.write_stringpad(abview,idx,this.data.labels[i],16);
    }
    for (var i=0;i<ns;i++) { idx = this.write_stringpad(abview,idx,"",80); }
    for (var i=0;i<ns;i++) { idx = this.write_stringpad(abview,idx,this.data.dims[i],8); }
    var physmin = [];
    var physmax = [];
    for (var i=0;i<ns;i++) {
      physmin.push(this.data.signals[i][0]);
      physmax.push(this.data.signals[i][0]);
      for (var j=1;j<this.data.signals[i].length;j++) {
        var v = this.data.signals[i][j];
        if (v<physmin[i]) physmin[i]=v;
        if (v>physmax[i]) physmax[i]=v;
      }
    }
    if (aidx!=-1) {
      physmax[aidx]=32767;
      physmin[aidx]=-32768;
    }
    for (var i=0;i<ns;i++) { idx = this.write_stringpad(abview,idx,physmin[i]+"",8); }
    for (var i=0;i<ns;i++) { idx = this.write_stringpad(abview,idx,physmax[i]+"",8); }
    for (var i=0;i<ns;i++) { idx = this.write_stringpad(abview,idx,"-32768",8); }
    for (var i=0;i<ns;i++) { idx = this.write_stringpad(abview,idx,"32767",8); }
    for (var i=0;i<ns;i++) { idx = this.write_stringpad(abview,idx,"",80); }
    for (var i=0;i<ns;i++) { idx = this.write_stringpad(abview,idx,nr[i]+"",8); }
    for (var i=0;i<ns;i++) { idx = this.write_stringpad(abview,idx,"",32); }
    for (var r=0;r<rn;r++) {
      for (var s=0;s<ns;s++) {
        for (var i=0;i<nr[s];i++) {
          idx = this.write_int(abview,idx,this.data.signals[s][r*nr[s]+i],physmin[s],physmax[s]);
        }
      }
    }
    this.saveFile(abdata,this.data.filename);
    this.record=false;
  }
}

function ageString(age) {
  var str
   if (age<1/12) 
     str=(age*356).toFixed(0)+' days old';
   else if (age<1) 
     str=(age*12).toFixed(1)+' months old';
   else
     str=(age).toFixed(0)+' years old';
  return str;
}

function initSignalBase() {
  signalbase = new SignalBase({
    "onafterload": function () {
      desktop.statusbar.set(1,signalbase.data.filename);
      desktop.statusbar.set(2, signalbase.data.starttime.replace(/\./g,':') + ' ' +
        Math.round(signalbase.duration()/60) + 'min');
    },
    "onchange": function () {
      desktop.statusbar.set(3,
        ageString(stanpumpConfig.age) + ' ' + 
        stanpumpConfig.sex + ' ' +
        stanpumpConfig.weight + 'kg ' +
        stanpumpConfig.height + 'cm '
      );
      refreshPlots();
    }
  });
}

