import {SuiExecuteTransactionResponse} from "@mysten/sui.js";

// Function for catching errors during tx execution
function handle_tx_with_message(tx: SuiExecuteTransactionResponse, tx_name: string) {
    let effects = tx["EffectsCert"];
    let status = effects.effects.effects;
    let tx_status = status.status;
    switch (tx_status.status) {
        case "failure":
            console.error(`Tx "${tx_name}" fail with message: \n ${tx_status.error}`);
            process.exit(0);
        case "success":
            console.log(`Tx "${tx_name}" succeed :\n `, tx)

    }
}

export
{
    handle_tx_with_message
};