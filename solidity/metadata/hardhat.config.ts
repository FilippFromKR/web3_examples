import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const dotenv = require("dotenv");
dotenv.config({path: __dirname + '/.env'});

const PRIVATE_KEY: string = process.env.PRIVATE_KEY;
const ALCHEMY_KEY: string = process.env.ALCHEMY_KEY;

const config: HardhatUserConfig = {
    solidity: "0.8.17",
    defaultNetwork: "goerli",

    networks: {

        goerli: {
            url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_KEY}`,
            accounts: [PRIVATE_KEY],
        },

    }
};

export default config;