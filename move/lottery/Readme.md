# Lottery smart contract with Drand randomness

This project demonstrates the creation of a simple lottery campaign,
where everyone can create the campaign. And also, close the campaign
and derive a winner by providing Drand signatures of the specified round.


Sui contracts code
> contracts/

Typescript scripts code
> scripts/

# Setup guide

publish smart contract with commands

`sui client publish --gas-budget 10000`
copy paste the Program ID from `Created Objects`(first id) and put it into .env file in
>PROGRAM_ID

create two Sui wallets and fill
>ALICE_MNEMONIC
> PUBLISHER_MNEMONIC

Create Nft from `publisher account` in your wallet and put it to the
`prize` field in `build.ts`.
(if you will use not default Nft also change field `nftTy` for appropriate to your prize type)


Publish smart contract to devnet
> cd contracts && sui client publish --gas-budget 10000

Install TS dependencies
> cd scripts && npm install

Run TS script
> npm run build
