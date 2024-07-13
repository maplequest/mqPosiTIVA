
var webrpath='https://webr.r-wasm.org/latest/webr.mjs';

function timeoutPromise(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import(webrpath).then(async ({WebR}) => {

    const webr = new WebR();
    await webr.init();

    let stanpump = await fetch(mqVersion+'/stanpump.R');
    await webr.evalR(await stanpump.text());

    async function stanpump_update() {

      if (stanpumpConfig.time.length==0) {
        if (stanpumpConfig.action=="simulate") {
          stanpumpError=null;
          stanpumpResult = "[]"
          stanpumpDirty=false; 
          stanpumpProcessSimulation();
          return;
        }
      }

      var str = JSON.stringify(stanpumpConfig);
//      await webr.objs.globalEnv.bind('str', str)
      const obj = await new webr.RObject(str);
      const env = await new webr.REnvironment({ str: obj });

      try {
        //var tmp = await webr.evalR('stanpump(str)')
        var tmp = await webr.evalR('stanpump(str)',{ env });
        stanpumpResult = await tmp.toString()
        webr.destroy(tmp);
        stanpumpError = null
      } catch (error) { 
        stanpumpError = error
        stanpumpResult = "[]"
      }

      webr.destroy(env);
      webr.destroy(obj);

      stanpumpDirty=false;
      console.log('stanpumpR done')
      if (stanpumpError) stanpumpErrorUI();
  
      if (stanpumpConfig.action=="simulate") {
        try { stanpumpProcessSimulation(); } catch (error) { console.error('Invalid stanpumpR output') }
      } else { 
        try { stanpumpProcessSuggestion(); } catch (error) { console.error('Invalid stanpumpR output') }
      }
    }

    while (true) {
      if (stanpumpDirty) {
        if (stanpumpConfig.action==null) stanpumpConfig.action="simulate";
        await stanpump_update()
      } else { 
        await timeoutPromise(200)
      }
    }

});

