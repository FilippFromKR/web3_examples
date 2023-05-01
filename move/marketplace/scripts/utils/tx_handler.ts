import {JsonRpcProvider, SuiExecuteTransactionResponse} from "@mysten/sui.js";

// Function for catching errors during tx execution
function handle_tx_with_message(tx: SuiExecuteTransactionResponse, tx_name: string) {
    // @ts-ignore
    let effects = tx["EffectsCert"];
    let status = effects.effects.effects;
    let tx_status = status.status;
    switch (tx_status.status) {
        case "failure":
            console.error(`Tx "${tx_name}" fail with message: \n ${tx_status.error}`);
            process.exit(0);
        case "success": {
            console.log(`Tx "${tx_name}" succeed :\n `, tx);
            return
        }

    }
}
async function get_field_from_tx_event(provider: JsonRpcProvider, tx: SuiExecuteTransactionResponse, field_name: string):Promise<string>
{
    // @ts-ignore
    let tx_effects = tx["EffectsCert"];
    let certificate = tx_effects.certificate;

    return await provider.getEvents({
        Transaction: certificate.transactionDigest,
    }, null, null)
        .then(events => {

            let fields = events.data.map(event => {
                // @ts-ignore
                let move_event = event.event["moveEvent"];
                if (move_event != undefined)
                    return move_event.fields
            });

            return fields[0][field_name]
        })
}

export
{
    get_field_from_tx_event,
    handle_tx_with_message
};