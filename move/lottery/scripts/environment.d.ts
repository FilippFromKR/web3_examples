declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PUBLISHER_MNEMONIC: string,
            ALICE_MNEMONIC: string,
            PROGRAM_ID: string,
            CHAIN_HASH: string,

        }
    }
}
export {}
