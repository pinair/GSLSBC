import Web3 from 'web3';
import Transaction from 'ethereumjs-tx'; // raw transactions
import { Wallet } from 'ethers'; // wallet utils 
import * as http from 'http'; // http requests 
import jsonFile from 'jsonfile'; // i/o json files
import path from 'path'; // handle paths 
import * as _ from 'lodash'; // utility functions 

import secp256k1 from 'secp256k1';
import ethUtils from 'ethereumjs-util';
import { Api } from './api';

const SolidityFunction = require('web3/lib/web3/function'); // hex converter
const socialRecordContract = require('../build/contracts/SocialRecord.json'); // social record contract
const config = require('../resources/config');
const GSLS_ADDRESS = config.contractAddress; // SOCIAL RECORD CONTRACT GETH

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider());

// set up event watchers 
const SocialRecordAdded = getGSLS().SocialRecordAdded({ fromBlock: 0, toBlock: 'latest' });
// const SocialRecordUpdated = getGSLS().SocialRecordUpdated({ fromBlock: 0, toBlock: 'latest' });

let eventsList = {
    'SocialRecordAdded': SocialRecordAdded
        // 'SocialRecordUpdated': SocialRecordUpdated
}

SocialRecordAdded.get((error, result) => {
    if (error) {
        console.error("ERROR: ", error);
    } else {
        console.log("RESULT: ", result.args);
    }
});

// SocialRecordUpdated.get((error, result) => {
//     if (error) {
//         console.error("ERROR: ", error);
//     } else {
//         console.log("RESULT: ", result.args);
//     }
// });

// subscribe to events used for testings... 
function subscribeToEvent(eventName, cb) {
    console.log(eventName);
    if (eventName.constructor === Array) {
        eventName.forEach(function(name) {
            eventsList[name].watch((error, result) => {
                if (error) {
                    console.error("ERROR: ", error);
                    cb(error, null);
                } else {
                    console.log("RESULT: ", result.args);
                    cb(null, result.args);
                }
            });
        });
    } else {
        console.log("not array");
        eventsList[eventName].watch((error, result) => {
            if (error) {
                console.error("ERROR: ", error);
                cb(error, null);
            } else {
                console.log("RESULT: ", result.args);
                cb(null, result.args);
            }
        });
    }
}

// TEST FUNCTION: deploys a contract
function test(e, cb) {

    console.log('TEST');
    web3.personal.unlockAccount(web3.eth.accounts[0], 'test-account-pwd', 15000);
    web3.eth
        .contract(socialRecordContract.abi) // socialRecordContract
        .new({
            from: web3.eth.accounts[0],
            data: socialRecordContract.unlinked_binary, // socialRecordContract
            gas: '4700000'
        }, function(error, contract) {

            if (error)
                console.log(error);

            if (typeof contract.address !== 'undefined') {
                console.log(contract.address);
                config.contractAddress = contract.address;
                jsonFile.writeFileSync('./resources/config.json', config);
                console.log(contract.address);
                cb(contract.address);
            }
        });
}

// TEST FUNCTION: attempts to use ecrecover
function test2(e, cd) {
    let GID = "1WQZLRE0PWU46VPD2RJ3231AO6ZRCI8YMMQLRC5KFYTTYB8UH0";
    let message = "Social Record Payload";
    let messageHash = web3.sha3(message);
    // let messageBuffer = ethUtils.toBuffer(messageHash);
    console.log(messageHash);
    console.log(Buffer.from(window.currentWallet.privateKey.slice(2), 'hex'))

    let bufferMessage = Buffer.from(messageHash.slice(2), 'hex');
    let bufferPrivKey = Buffer.from(window.currentWallet.privateKey.slice(2), 'hex');

    // sign the message
    const sig = secp256k1.sign(bufferMessage, bufferPrivKey);

    console.log(sig);
    let ret = {}
    ret.r = sig.signature.slice(0, 32)
    ret.s = sig.signature.slice(32, 64)
    ret.v = sig.recovery + 27
    console.log(ret);

    getGSLS().verify2(bufferMessage, ret.v, ret.r, ret.s, { from: window.currentWallet.address }, function(error, result) {
        if (error) {
            console.log(error);
        } else {
            console.log(result);
        }
    });
    // let toSend = {
    //     msg: messageHash,
    //     r: ret.r,
    //     s: ret.s,
    //     v: ret.v
    // }
    // console.log(toSend);

    // var options = {
    //     host: 'localhost',
    //     path: '/verify/signature',
    //     //since we are listening on a custom port, we need to specify it by hand
    //     port: '8080',
    //     //This is what changes the request to a POST request
    //     method: 'POST'
    // };

    // return new Promise((resolve, reject) => {
    //     let req = http.request(options, (response) => {
    //         var str = ''
    //         response.on('data', function(chunk) {
    //             str += chunk;
    //         });

    //         response.on('end', function() {
    //             console.log(`Got a response!\n\n`);

    //             console.log(str);
    //             resolve(str);
    //         });
    //     });

    //     req.write(JSON.stringify(toSend));
    //     req.end();
    // });
}


// Inside getSocialRecord(globalID)
// return new Promise(function(resolve, reject) {
//     getGSLS().getSocialRecord(globalID, { from: window.currentWallet.address }, function(error, socialRecord) {
//         if (error) {
//             console.log(error);
//             reject(error);
//         } else {
//             console.log(socialRecord);
//             resolve(JSON.parse(socialRecord));
//         }
//     })
// });