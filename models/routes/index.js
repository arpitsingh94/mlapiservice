var express = require('express');
var router = express.Router();
var path = require('path');
var multer  = require('multer');
var uuid = require('uuid');
var dynamo = require('../services/dynamo');
var scripter = require('../services/runner');
var to = require('await-to-js').to;
var _cp = require('child_process');
/*
types are:
  trainImages
  testImages
  train
  test
*/
const fieldMapping = {
  "images" : "trainImages",
  "image" : "testImages"
};

var upload = multer({ 
	storage: multer.diskStorage({
	  destination: async (req, file, cb) => {
      //get modelId
      let modelId = req.body.modelId;
      //need field to save properly
      let type = fieldMapping[file.fieldname];
      let fullPath = path.join(__dirname, '../files/',modelId,type);
      //create full path
      _cp.exec('mkdir -p '+fullPath, ()=>{
        cb(null, fullPath);
      });
	  },
	  filename: (req, file, cb) => {
	    cb(null, file.originalname);
	  }
	})
});


//Create Model
router.post('/model', async (req, res) => {
  var modelId = uuid.v1();
  var model = {
    modelId: modelId,
    name: req.body.name || "Untitled",
    description: req.body.description || "",
    experiments: []
  };
  let [err,data] = await to(dynamo.saveModel(model));
  if(err) res.status(500).send({"error": err});
  else res.status(200).send({"modelId" : modelId});
});

//upload training images
router.put('/model/upload',upload.array('images'), async (req, res) => {
  var modelId = req.body.modelId;
  let [err,data] = await to(dynamo.getModel(modelId));
  if(err){
    //remove files that were saved
    console.log("index#upload error in fetching model, will delete images");
    res.status(500).send({"error": err});
    let fullPath = path.join(__dirname, '../files/',modelId);
    _cp.exec('rm -rf '+fullPath, ()=>{});
  }
  else if(!data){
    //remove files that were saved
    console.log("index#upload invalid modelId, will delete images");
    res.status(500).send({"error": "invalid modelId"});
    let fullPath = path.join(__dirname, '../files/',modelId);
    _cp.exec('rm -rf '+fullPath, ()=>{});
  }
  else{
    res.status(200).send("ok");
  }
});

//generate and run experiments
router.put('/model/experiment', async (req, res, next) => {
  var modelId = req.body.modelId;
  let [err,model] = await to(dynamo.getModel(modelId));
  if(err){
    return res.status(500).send({"error": err});
  }
  else if(!model){
    return res.status(500).send({"error": "invalid modelId"});
  }
  //ok to proceed from here
  res.status(200).send("ok");
  var start = (new Date()).toISOString();
  var expParams = req.body.params;
  expParams.images = path.join(__dirname, '../files/',modelId,"trainImages");
  //run the scripts
  scripter.run("pytrain", expParams, async (err,result)=>{
    let exp ={
      params: expParams
    }
    exp.startTime = start;
    exp.endTime = (new Date()).toISOString();
    //get model again
    let [err1,model] = await to(dynamo.getModel(modelId));
    if(!err1){
      exp.status = err ? "fail" : "success";
      exp.accuracy = result.accuracy;
      model.experiments.push(exp);
      let [err2,data] = await to(dynamo.saveModel(model));
      if(err2) console.error("index#createExp unrecoverable error update",JSON.stringify(model));
    }
    else console.error("index#createExp unrecoverable error fetch", modelId, JSON.stringify(exp));
  });
});

router.get('/model', async (req, res) => {
  var modelId = req.query.modelId;
  let [err,data] = await to(dynamo.getModel(modelId));
  if(err){
    res.status(500).send({"error": err});
  }
  else{
    res.status(200).send(data);
  }
});

router.put('/model/test', upload.single('image'), async (req, res) => {
  var modelId = req.body.modelId;
  let [err,model] = await to(dynamo.getModel(modelId));
  if(err){
    return res.status(500).send({"error": err});
  }
  else if(!model){
    return res.status(500).send({"error": "invalid modelId"});
  }
  //get exp with highest accuracy
  let exp = null;
  model.experiments.forEach(x => {
    if(x.status == "success" && (!exp || x.accuracy>exp.accuracy)){
      exp = x;
    }
  });
  if(!exp){
    return res.status(500).send({"error": "no valid parameters found to use in test"});
  }
  delete exp.params.images;
  exp.params.image = path.join(__dirname, '../files/',modelId,"testImages",req.file.filename);
  //run the scripts
  scripter.run("pytest", exp.params, async (err,result)=>{
    //get result
    if(err){
      res.status(500).send({"error": "error in running test"});
    }
    else{
      res.status(200).send(result);
    }
  })
});

module.exports = router;
