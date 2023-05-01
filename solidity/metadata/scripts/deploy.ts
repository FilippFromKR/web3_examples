import {ethers} from "hardhat";

const base_url = "ipfs/QmP9ZqUJJQMdbjiechnANdxrPMpTjUWD1rSbHsQiQo4sZL/";
async function deploy()
{

    const mintFactory = await ethers.getContractFactory("Mint");
    let mint = await mintFactory.deploy(base_url,4);
    await mint.deployed();
    console.log(`Mint contract deployed at: ${mint.address}`);

   let tx = await mint.mint(3);
   await tx.wait(1);

   let token_uri = await mint.tokenURI(1);
   console.log(`Your Nft metadata: https://gateway.pinata.cloud/${token_uri}`);







}

deploy()
    .then(error => {
        console.error(error);
        process.exit(1);
    })