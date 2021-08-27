const express = require('express');

const axios = require('axios');

var cors = require('cors');
const { response } = require('express');

const app = express();

app.use(cors());


const port = 3001;

var axiosInstance = axios.create({
    baseURL: 'https://api.bitclout.com/api/',
    timeout: 1000,
    headers: 
    {
      'apiKey': "092dae962ea44b02809a4c74408b42a1",
      'content-type': "application/json"
  } 
})


var devBcltPublicKey = "BC1YLit7V8XL4xdAQH3HzsXZhSCcPioe3PGw5tB8h6EXqFwrppVAWHS"; //"BC1YLit7V8XL4xdAQH3HzsXZhSCcPioe3PGw5tB8h6EXqFwrppVAWHS";"BC1YLiH2F1CdEeDzgcxjgxof2qNqGLiF6DF2i87CuygVrJPC8dqwvNX"

//01e9111da33e662a25fe2c70c7dd78d0a88d83b6f97d55079f843080f840c8abc3010203573512f3a485eb22b87ddcdd3f754c5e27b4d6b9b2289d9bbe6ee198fe08bc5101035736fa4674860c51c92489430425467c8e5e23fa23395dd111366479fc5a63e0a1ea05020021035736fa4674860c51c92489430425467c8e5e23fa23395dd111366479fc5a63e00000

// Variables to maintain CloutPrice feed
var cloutPrice = 0;
var cloutPriceTime = new Date();

// Variable to maintain CloutBridgeBalance fee

var cloutBridgeBalance = 0;
var cloutBridgeBalanceTime = new Date();


app.get('/api/createTransaction', async (req, res) =>{

    /*
    if((req.query.amount !== undefined && req.query.amount > 0)){

    }*/

    //console.log(req.query.sender)

    var options = {
        method: "POST",
        url: 'https://api.bitclout.com/api/v0/send-bitclout',
        timeout: 5000,
        data: {
            SenderPublicKeyBase58Check: req.query.sender,
            RecipientPublicKeyOrUsername: devBcltPublicKey,
            AmountNanos: Number(req.query.amount),
            MinFeeRateNanosPerKB: 1000
        }
    }

    try{
        var result = await axiosInstance.request(options).then((result) =>{
            //console.log(result.data)
            return result.data.TransactionHex;
        })
    
        console.log(`transactionHex: ${result}`);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({transactionHex: result}));
    }
    catch(e){
        console.log(e + "Create transaction request error.");
    }
    
});


app.get('/api/getBalance', async (req, res) =>{

    //console.log("getBalance");
    try{
        var options ={
            method: "POST",
            url: 'https://api.bitclout.com/api/v1/balance',
            timeout: 19000,
            data:{
                PublicKeyBase58Check: req.query.sender
            }
        }

        var balance = 0;

        balance = await axiosInstance.request(options).then((response)=>{
            return response.data.ConfirmedBalanceNanos + response.data.UnconfirmedBalanceNanos;
        })

        //console.log(`${req.query.sender} Balance: ${balance}`);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({balance: balance}));
    }
    catch(error){
        console.log(error);
    }

    
})

app.get('/api/cloutBridgeBalance', async (req, res) =>{

    var currentTime = new Date();
    var elapsed = (currentTime - cloutBridgeBalanceTime) / 1000;

    if(elapsed > 20){
        try{
            cloutBridgeBalanceTime = currentTime;

            var options ={
                method: "POST",
                url: 'https://api.bitclout.com/api/v1/balance',
                timeout: 19000,
                data:{
                    PublicKeyBase58Check: devBcltPublicKey
                }
            }

            cloutBridgeBalance = await axiosInstance.request(options).then((response)=>{
                return response.data.ConfirmedBalanceNanos + response.data.UnconfirmedBalanceNanos;
            })

            //console.log(`${devBcltPublicKey} Balance: ${cloutBridgeBalance}`);

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({cloutBridgeBalance: cloutBridgeBalance}));

        }catch(err){
            console.log("Clout Bridge Balance Error",err);
        }
    }
    else{
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({cloutBridgeBalance: cloutBridgeBalance}));
    }

})


app.get('/api/sendTransaction', async (req, res) =>{

    try{
        var transactionOptions = {
            url: 'https://api.bitclout.com/api/v0/submit-transaction',
            method: 'POST',
            timeout: 10000,
            data: {
                TransactionHex: req.query.signedTransactionHex
            }
        }

        var txnHashHex = await axiosInstance.request(transactionOptions).then((result)=>{
            //console.log(result.data);
            return result.data.TxnHashHex;
        })
        
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({txnHashHex:txnHashHex}))
        //console.log(transactionOptions)

    }catch(e){
        console.log("transaction Error prob repeat.");
    }
});



app.get('/api/getUser', async (req, res) => {

    try{
        //console.log(req.query.sender);

        
        var userOptions={
            url: 'https://api.bitclout.com/api/v0/get-users-stateless',
            method: 'POST',
            timeout: 10000,
            data:{
                PublicKeysBase58Check: [req.query.sender],
                SkipForLeaderboard: false 
            } 
        } 
        
        await axiosInstance.request(userOptions).then((result)=>{
            if(result.data.UserList[0].ProfileEntryResponse !== null){
                //console.log(result.data.UserList[0].ProfileEntryResponse.Username);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({username: result.data.UserList[0].ProfileEntryResponse.Username}));
                return;
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({username: req.query.sender}));
        });
    
        //
    }
    catch(err){
        console.log("get user error", err);
    }
    
});

var priceOptions = {
    url: 'https://api.bitclout.com/api/v0/get-exchange-rate',
    method:'GET',
    timeout: 10000
}

app.get(`/api/cloutPrice`, async (req,res) =>{

    var currentTime = new Date();
    var elapsed = (currentTime - cloutPriceTime) / 1000;

    if(elapsed > 20){
        //console.log(`Sending new clout price ${elapsed}`);

        cloutPriceTime = currentTime;

        try{
            cloutPrice = await axiosInstance.request(priceOptions).then((result)=>{
                //console.log(result.data);
                return result.data;
            })
            res.setHeader('Content-Type', 'application/json');
    
            res.send(JSON.stringify(cloutPrice));
        }
        catch(err){
            console.log(err)
        }
        
    }
    else{
        //console.log(`Sending current clout price ${elapsed}`);

        res.setHeader('Content-Type', 'application/json');
    
        res.send(JSON.stringify(cloutPrice));
    }
    
});



app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send({greet: `Welcome to my server! This is the homepage on port 3001`});
  });

app.listen(port, ()=>{
    console.log(`Clout Bridge Proxy listening at http://localhost:${port}`)
})