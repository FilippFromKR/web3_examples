declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PRIVATE_KEY: string;
            ALCHEMY_KEY: string;
        }
    }
}
export {}