
function stressPlots () {
  refreshPlots();
  var done = false;
  var desktop = mqElement('desktop');
  var nodes = desktop.childNodes;
  for (const node of nodes) {
    if (node.nodeName!='DIV') done=true;
  }
  if (!done) setTimeout(stressPlots,350);
}

function stressPlots2 () {
  var done = false;
  var desktop = mqElement('desktop');
  var nodes = desktop.childNodes;
  for (const node of nodes) {
    if (node.nodeName!='DIV') done=true;
  }
  if (done) return;
  stanpumpDirty=true;
  setTimeout(stressPlots2,350);
}

