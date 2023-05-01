# Marketplace smart contract

Smart contract for the trading of unique objects, with fee for trade.
User can sale the object, by providing it and a specific object price.
Also, the user can take the object back, if the item have not sold.


Sui contracts code
> contracts/

Typescript scripts code
> scripts/

# Setup guide

publish smart contract with commands

`sui client publish --gas-budget 10000`
copy and paste the Program ID from Created Objects(Second id) and put it into .env file in
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
