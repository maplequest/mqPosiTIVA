
function initKeyboard () {
  document.onkeyup = function (e) {
    if (e.ctrlKey) {
//      console.log(e.which);
      if (e.which==90) {
        e.preventDefault();
        undo();
      } else if (e.which==89) {
        e.preventDefault();
        redo();
      } else if (e.which==67) {
        covariatesUI();
      } else if (e.which==68) {
        dosingUI();
      }
    }
  };
}

