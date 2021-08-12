const express = require('express');

const axios = require('axios');

var cors = require('cors');

const app = express();

app.use(cors());

/*
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });*/

  /*
  var allowedOrigins = ['http://localhost:3000',
                      'http:cloutbridge.net'];
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));*/

/*
res.setHeader("Access-Control-Allow-Origin", 'http://myDomain:8080');
res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS,PUT,DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');*/

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
    }
    catch(e){
        console.log(e + "Create transaction request error.");
    }
    
    res.send(JSON.stringify({transactionHex: result}));
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

        console.log(`${req.query.sender} Balance: ${balance}`);

        res.send(JSON.stringify({balance: balance}));
    }
    catch(error){
        console.log(error);
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
            console.log(result.data.TxnHashHex);
            return result.data.TxnHashHex;
        })
        
        res.send(JSON.stringify({txnHashHex:txnHashHex}))
        //console.log(transactionOptions)

    }catch(e){
        console.log("transaction Error prob repeat.");
    }
})

app.get('/api/exchangePrice', async (req, res) =>{
    /*
    var priceOptions = {
        url: 'https://api.bitclout.com/api/v0/get-exchange-rate',
        method:'GET',
        timeout: 10000
    }

    try{
        var exchangePrice = await axiosInstance.request(priceOptions).then((result)=>{
            console.log(result.data);
            return result.data;
        })
        res.setHeader('Content-Type', 'application/json');

        res.send(JSON.stringify(exchangePrice));
    }
    catch(err){
        console.log(err)
    }*/

    //res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ greeting: `Hello random!` }));

})

/*
app.get('/api/getUser', async (req, res) => {

    console.log(res.query.user);

    var userOptions={
         url: 'https://api.bitclout.com/api/v0/get-users-stateless',
         method: 'POST',
         data:{
            PublicKeysBase58Check: req.query.user,
            SkipForLeaderboard: false 
         } 
    } 
})*/
app.get('/api/greeting', async (req, res) => {

    await axios.get("https://api.bitclout.com/api/v1", {headers:{'apiKey': "092dae962ea44b02809a4c74408b42a1", 'content-type': "application/json"}})
            .then(function(result){
                console.log(result);
            })
  
    const name = req.query.name || 'World';
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
  });



app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send({greet: `Welcome to my server! This is the homepage on port 3001`});
  });

app.listen(port, ()=>{
    console.log(`Clout Bridge Proxy listening at http://localhost:${port}`)
})