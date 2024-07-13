
function initSplash (fixed) {
  var wnd = mqWindow({
    id: 'splash',
    title: 'About ' + mqTitle,
    width: '300px',
    height: (fixed?194:170)+'px',
    borderless: (fixed?false:true)
  });
  mqSet('splash','padding','5px','text-align','center');
  var obj = mqMakeWidget({
    tag: 'img',
    id: 'splash-logo',
    src: mqVersion+'/icons/full-logo.svg',
    width: '200px',
    'margin-top': '20px'
  });
  mqAppend(wnd,obj);
  obj = mqMakeWidget({
    tag: 'div',
    id: 'splash-label',
    innerHTML: mqTitle + ' ' + mqVersion,
    'margin-top': '20px'
  });
  mqAppend(wnd,obj);
  obj = mqMakeWidget({
    tag: 'div',
    id: 'splash-legal',
    'font-size': '10px',
    //'text-align': 'justify',
    innerHTML: `Copyright &copy; 2024 MapleQuest Innovations`,
    'margin-top': '20px'
  });
  mqAppend(wnd,obj);
  if (!fixed) setTimeout(function () { mqDelete('splash-window'); }, 5000);
}


