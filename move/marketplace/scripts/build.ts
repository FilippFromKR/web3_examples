import {JsonRpcProvider, Network as suiNetwork, RawSigner} from "@mysten/sui.js";
import {keyPairFromMnemonic} from "./utils/keypair";
import {get_field_from_tx_event, handle_tx_with_message} from "./utils/tx_handler";
import * as assert from "assert";

const dotenv = require("dotenv");
dotenv.config({path: __dirname + '/.env'});

/*----Sui----*/
const ProgramId: string = process.env.PROGRAM_ID!;
const ModuleName = "marketplace";
const PublisherMnemonic: string = process.env.PUBLISHER_MNEMONIC!;
const AliceMnemonic: string = process.env.ALICE_MNEMONIC!;



// TODO: Create new nft
const objectForSale = "0x003d9116ebe73d96bb87a46c08d27ab7131c8d07";

/*---Generics----*/
const objectForSaleTy = "0x2::devnet_nft::DevNetNFT";
const coinTy = "0x2::sui::SUI";



async function main() {


    // Connect to devnet
    let provider = new JsonRpcProvider(suiNetwork.DEVNET);

    // get Keypair of contract publisher from mnemonic phrase
    let keypair = keyPairFromMnemonic(PublisherMnemonic);
    let signer = new RawSigner(keypair, provider);
    let publisher_address = await signer.getAddress();


    // Get Alice key pair
    let alice_key_pair = keyPairFromMnemonic(AliceMnemonic);
    let alice = new RawSigner(alice_key_pair, provider);
    let alice_address = await alice.getAddress();




    /*----Call contract functions-----*/
    let admin_access_object:string = await provider.getObjectsOwnedByAddress(publisher_address)
        .then(objects => {
            let object = objects.find(object => {
                return object.type == `${ProgramId}::${ModuleName}::MarketManagerCap`;
            }
            )!;
            return object.objectId

        });



    const create_market_tx = await signer.executeMoveCall({
        packageObjectId: ProgramId,
        module: ModuleName,
        function: "create_market",
        typeArguments: [objectForSaleTy, coinTy],
        arguments: [
            admin_access_object
        ],
        gasBudget: 10000,
    });
    handle_tx_with_message(create_market_tx, "Create market.");


    let  market_id: string =
        await get_field_from_tx_event(provider,create_market_tx,"market_id");

    let object_price = 100;


    const list_tx = await signer.executeMoveCall({
        packageObjectId: ProgramId,
        module: ModuleName,
        function: "list",
        typeArguments: [objectForSaleTy,coinTy],
        arguments: [
           market_id,
            objectForSale,
            object_price
        ],
        gasBudget: 10000,
    });

    handle_tx_with_message(list_tx, "list");


    let item_index: string = await get_field_from_tx_event(provider,list_tx,"index");

    // Get alice coin
    let alice_coin: string = await provider.getObjectsOwnedByAddress(alice_address)
        .then(objects => {

            let object = objects.find(object => object.type.includes("SUI")
            )!;
            return object.objectId

        });

    const purchase_and_take_tx = await signer.executeMoveCall({
        packageObjectId: ProgramId,
        module: ModuleName,
        function: "purchase_and_take",
        typeArguments: [objectForSaleTy,coinTy],
        arguments: [
            market_id,
            item_index,
            alice_coin
        ],
        gasBudget: 10000,
    });

    handle_tx_with_message(purchase_and_take_tx, "purchase_and_take_tx");


    let alice_asset = await provider.getObjectsOwnedByAddress(alice_address)
        .then(objects => {
            let object = objects.find(object => object.type.includes("DevNetNFT")
            )!;
            return object.objectId
        });

console.log(alice_asset);





}
main().catch(error => {
    console.error(error);
    process.exit(0);
});
