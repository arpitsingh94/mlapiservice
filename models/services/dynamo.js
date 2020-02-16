var aws = require('aws-sdk');
var dynamodb = new aws.DynamoDB();
var dynamodbDC = new aws.DynamoDB.DocumentClient();

const tableMap = {
    "models": {
        KeySchema: [
            {
                AttributeName: 'modelId',
                KeyType: 'HASH'
            }
        ],
        AttributeDefinitions: [
            {
                AttributeName: "modelId", 
                AttributeType: "S"
            }
        ]
    }
}
var dynamo = {};
dynamo.init = async ()=>{
    console.log("dynamo#init");
    //create all tables if they dont exist
    var r = new Promise((resolve, reject)=>{
        dynamodb.listTables({},async (err,data)=>{
            if(err) reject(err);
            else{
                //our tables
                var tablePromises = [];
                Object.keys(tableMap).forEach(x => {
                    if(data.TableNames.indexOf(x) == -1){
                        //create this table
                        var pr = new Promise((resolve, reject)=>{
                            dynamodb.createTable({
                                TableName: x,
                                KeySchema: tableMap[x].KeySchema,
                                AttributeDefinitions: tableMap[x].AttributeDefinitions,
                                BillingMode: "PAY_PER_REQUEST"
                            }, (err)=>{
                                 if(err) reject(err);
                                 else resolve();
                            });
                        });
                        tablePromises.push(pr);
                    }
                });
                try{
                    let res = await Promise.all(tablePromises);
                    console.log("dynamo#init succesfully created all tables");
                    resolve();
                }
                catch(e){
                    console.error("dynamo#init error in creating tables: ",e);
                    reject(e);
                }
            }
        });
    });
    return r;
}

dynamo.saveModel = async (modelData)=>{
    console.log("dynamo#saveModel", modelData);
    var params = {
        TableName: "models",
        Item : modelData
    };
    return new Promise((resolve, reject) => {
        dynamodbDC.put(params, function(err, data) {
            if (err){
                console.error("dynamo#saveModel error in saving/updating model",err);
                reject(err);
            }
            else{
                console.log("dynamo#saveModel success");
                resolve(data);
            }
        });
    });
}

dynamo.getModel = async (modelId)=>{
    console.log("dynamo#getModel", modelId);
    var params = {
        TableName: "models",
        Key: {
            modelId: modelId
        }
    };
    return new Promise((resolve, reject) => {
        dynamodbDC.get(params, function(err, data) {
            if (err){
                console.error("dynamo#getModel error in fethcing model",modelId, err);
                reject(err);
            }
            else{
                console.log("dynamo#getModel success");
                resolve(data.Item);
            }
        });
    });
}

module.exports = dynamo;