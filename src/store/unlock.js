import qora from 'qora-core';
import { createAction } from 'redux-actions';
import * as walletActions from '../actions/wallet';
import * as utilsActions from '../actions/utils';
import * as types from '../constants/ActionTypes';
import * as transactionService from '../services/transaction';


async function getWalletSeed(wallet, openUnlock) {
    return new Promise((resolved, rejected)=> {
        if (wallet.seed) {
            return resolved(wallet.seed);
        }
        openUnlock((pwd)=> {
            try {
                resolved(JSON.parse(qora.core.decrypt(wallet.encryptWallet, pwd)).seed);
            }
            catch (e) {
                rejected(e);
            }
        });
    });
}

async function getLastReference(address, unconfirmedTransaction) {
    let lastReference;
    unconfirmedTransaction = findUnconfirmedLastReference(unconfirmedTransaction);
    if (!unconfirmedTransaction.length) {
        lastReference = await transactionService.getLastReference(address);
    }
    else {
        lastReference = unconfirmedTransaction[0].signature;
    }
    return lastReference;
}


function findUnconfirmedLastReference(arr) {
    return arr.filter(item=> {
        return item.confirmations === 0
    });
}


export default ({ dispatch, getState })=> next => action => {
    const { account, transaction, wallet } = getState();
    const { unconfirmedTransaction } = transaction;
    const { meta={}, payload={}, error } = action;
    const { unlock } = meta;

    next(action);

    if (!unlock || error) return;


    if (unlock === 'transaction') {
        const { address } = account;
        dispatch(createAction(action.type, async()=> {
            let txRaw;

            const seed = await getWalletSeed(wallet, (resolved)=> {
                dispatch(utilsActions.openUnlock({
                    resolved
                }));
            });

            const lastReference = await getLastReference(address, unconfirmedTransaction);


            if (action.type === types.SEND) {
                const { fee, recipient, amount } = payload;
                txRaw = qora.transaction.generatePaymentTransactionRaw({
                    seed,
                    lastReference,
                    recipient,
                    amount,
                    fee
                });
            }
            return await transactionService.processTx(txRaw);
        }, ({resolved, rejected})=> {
            return {
                resolved,
                rejected,
                sync: 'transaction'
            };
        })(payload));
    }
}

//var returnExample = {
//    "reference": "ZggAH1d1ZuzXi59hZj2TDezpruGUnYn4N6bzRh4pehwFPaqxBhsUKhzhvYauw6FPrmg2L8R64ALPJu8x7Mu9FzY",
//    "amount": "1.00000000",
//    "signature": "Qcqfnjz8xPksCB5YBYSEfP8iQZ5WB6E2MYDQh5pF3QXPURT6SXSHrmmpg5ygcRyYte6qvBHWCwdSzVrp4uivMRn",
//    "sender": "QPkAnJJG5TfnwQW8vaHgJUmreodXb4ssLr",
//    "fee": "10.00000000",
//    "recipient": "QePQC5SHPMyorXLMHdiRA5WzsSqgiUcWKZ",
//    "type": 2,
//    "confirmations": 0,
//    "timestamp": 1457445616575
//};
