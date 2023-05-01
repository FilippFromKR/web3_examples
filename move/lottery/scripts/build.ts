import { JsonRpcProvider, Network as suiNetwork, RawSigner} from '@mysten/sui.js';
import {Drand} from "./drand/drand";
import * as assert from "assert";
import {handle_tx_with_message} from './utils/tx_handler';
import {Time} from "./utils/time";
import {keyPairFromMnemonic} from "./utils/keypair";
import {hexToBytes} from "./utils/hex";

const dotenv = require("dotenv");
dotenv.config({path: __dirname + '/.env'});

/*----Sui----*/
const ProgramId: string = process.env.PROGRAM_ID!;
const ModuleName = "lottery";
const PublisherMnemonic: string = process.env.PUBLISHER_MNEMONIC!;
const AlicerMnemonic: string = process.env.ALICE_MNEMONIC!;

/*----Drand----*/
const DrandUrL: string = "https://drand.cloudflare.com/";
const DrandGenesisTime: number = 1595431050;
const DrandPeriod: number = 30;
const DrandChainHash: string = process.env.CHAIN_HASH!;

// TODO: Create new nft
const prize = "0x092808afec59e64c5b1a41ee69ad1bd6b4c316b6";
const nftTy = "0x2::devnet_nft::DevNetNFT";


async function main() {


    // Initialize Drand
    let drand = new Drand(DrandUrL, DrandGenesisTime, DrandChainHash, DrandPeriod);

    // Connect to devnet
    let provider = new JsonRpcProvider(suiNetwork.DEVNET);

    // get Keypair of contract publisher from mnemonic phrase
    let keypair = keyPairFromMnemonic(PublisherMnemonic);
    let signer = new RawSigner(keypair, provider);


    // Get Alice key pair
    let alice_key_pair = keyPairFromMnemonic(AlicerMnemonic);
    let alice = new RawSigner(alice_key_pair, provider);
    let alice_address = await alice.getAddress();


    // campaign variables
    let max_tickets = 100;
    let ticket_price = 1;

    let campaign_will_be_finished_in_minutes = 0;
    let drand_round = drand.calculate_future_round(Time.Minute, campaign_will_be_finished_in_minutes);


    // call contract function
    const create_campaign_tx = await signer.executeMoveCall({
        packageObjectId: ProgramId,
        module: ModuleName,
        function: "create_campaign",
        typeArguments: [nftTy],
        arguments: [
            max_tickets,
            ticket_price,
            drand_round,
            prize,
        ],
        gasBudget: 10000,
    });
    handle_tx_with_message(create_campaign_tx, "Create campaign");


    let tx_effects = create_campaign_tx["EffectsCert"];
    let certificate = tx_effects.certificate;

    let campaign_id: string =
        await provider.getEvents({
            Transaction: certificate.transactionDigest,
        }, null, null)
            .then(events => {

                let fields = events.data.map(event => {
                    let move_event = event.event["moveEvent"];
                    if (move_event != undefined)
                        return move_event.fields
                });

                return fields[0].campaign_id
            });

    let tickets_to_buy = 50;

    // Get alice coin
    let alice_coin: string = await provider.getObjectsOwnedByAddress(alice_address)
        .then(objects => {

            let object = objects.find(object => object.type.includes("SUI")
            )!;
            return object.objectId

        });



    // Alice participate first time
    const buy_ticket_tx = await alice.executeMoveCall({
        packageObjectId: ProgramId,
        module: ModuleName,
        function: "buy_without_ticket",
        typeArguments: [nftTy],
        arguments: [
            campaign_id,
            tickets_to_buy,
            alice_coin,
        ],
        gasBudget: 1000,
    });
    handle_tx_with_message(buy_ticket_tx, "Alice bought ticket");


    // Campaign only for one minutes, so we can close it immediately
    // By providing signatures of two preceding the round specified in the campaign
    let drand_for_close = await drand.getByRound(drand_round - 2);

    const close_tx = await alice.executeMoveCall({
        packageObjectId: ProgramId,
        module: ModuleName,
        function: "close_campaign",
        typeArguments: [nftTy],
        arguments: [
            campaign_id,
            hexToBytes(drand_for_close.signature),
            hexToBytes(drand_for_close.previous_signature),
        ],
        gasBudget: 1000,
    });
    handle_tx_with_message(close_tx, "close_tx");




    // Now, we can get a winner by providing drand signatures
    let drand_for_winner = await drand.getByRound(drand_round);
    const winner_tx = await alice.executeMoveCall({
        packageObjectId: ProgramId,
        module: ModuleName,
        function: "get_winner",
        typeArguments: [nftTy],
        arguments: [
            campaign_id,
            hexToBytes(drand_for_winner.signature),
            hexToBytes(drand_for_winner.previous_signature),
        ],
        gasBudget: 10000,
    });
    handle_tx_with_message(winner_tx, "Winner derived!");



    // Alice claim her reward with her ticket
    let alice_ticket = await provider.getObjectsOwnedByAddress(alice_address)
        .then(objects => {
            let object = objects.find(object => {
                return object.type == `${ProgramId}::${ModuleName}::Ticket`;}
            )!;
            return object.objectId

        });
    let claim_tx = await alice.executeMoveCall({
        packageObjectId: ProgramId,
        module: ModuleName,
        function: "claim_reward",
        typeArguments: [nftTy],
        arguments: [
            campaign_id,
            alice_ticket,
        ],
        gasBudget: 1000000,
    });
    handle_tx_with_message(claim_tx, "Claim!");

    let alice_prize = await provider.getObjectsOwnedByAddress(alice_address)
        .then(objects => {
            let object = objects.find(object => object.type.includes("DevNetNFT")
            )!;
            return object.objectId
        });

    assert(alice_prize == prize);


}

main().catch(error => {
    console.error(error);
    process.exit(0);
});
