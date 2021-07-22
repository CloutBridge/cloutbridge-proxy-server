const express = require('express');

const axios = require('axios');

var cors = require('cors');

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

    var balance = 0;

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

         balance = await axiosInstance.request(options).then((response)=>{
            return response.data.ConfirmedBalanceNanos + response.data.UnconfirmedBalanceNanos;
        })
    }
    catch(error){
        console.log(error);
    }

    console.log(`${req.query.sender} Balance: ${balance}`);

    res.send(JSON.stringify({balance: balance}));
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
    var priceOptions = {
        url: 'https://api.bitclout.com/api/v0/get-exchange-rate',
        method:'GET',
        timeout: 10000
    }

    var exchangePrice = await axiosInstance.request(priceOptions).then((result)=>{
        //console.log(result.data);
        return result.data;
    })

    res.send(JSON.stringify(exchangePrice));

})

app.listen(port, ()=>{
    console.log(`Clout Bridge Proxy listening at http://localhost:${port}`)
})