const cp = require('child_process');
const path = require('path');

const scriptDir = path.join(__dirname, '../','scripts');
const scripts = {
    "pytrain" : {
        filename: "train.py",
        prog: "python"
    },
    "pytest" : {
        filename: "test.py",
        prog: "python"
    },
};
var scripter = {};
scripter.__getCommand = (scr, args) =>{
    if(scr.prog == "python"){
        var cmdarr = ['python'];
        cmdarr.push(path.join(scriptDir,scr.filename));
        Object.keys(args).forEach(x => {
            cmdarr.push('--'+x);
            cmdarr.push(args[x]);
        });
        return cmdarr.join(" ");
    }
};

scripter.run = (scriptid, args, cb) => {
    var scr = scripts[scriptid];
    var cmd = scripter.__getCommand(scr, args);
    console.log("scripter#run command: ",cmd);
    cp.exec(cmd, (err, stdout, stderr)=>{
        if(err){
            console.error("scripter#run error ",stderr);
            cb(stderr);
        }
        else {
            let output = JSON.parse(stdout.replace(/'/g, '"'));
            console.log("scripter#run output ",output);
            cb(null, output);
        }
    });
}

module.exports = scripter;