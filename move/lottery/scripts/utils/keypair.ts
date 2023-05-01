import {Ed25519Keypair} from "@mysten/sui.js";

function keyPairFromMnemonic(mnemonic: string): Ed25519Keypair {
    return Ed25519Keypair.deriveKeypair(mnemonic);
}
export
{
    keyPairFromMnemonic
}