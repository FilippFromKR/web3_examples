import {deploy} from "./common/deploy";
import { to_sec,Time } from "./common/time";

async function main() {

    let reward_pool = 100;
    let week_in_sec = to_sec(Time.Week, 1);
    // Deploy custom tokens and staking pool
    // For other tokens, pass their address to the arguments
    let {staking_pool,staking_token} = await deploy(week_in_sec, reward_pool);





}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
