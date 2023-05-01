# Creation of NFT collection with HashLips creator


## Steps to create NFT collection with hashLips nft engine:

- Download the following repo https://github.com/HashLips/hashlips_art_engine
  and install dependencies by running `npm install`.

- We need to have images for future NFTs seperated by layers
  in 'layer' directory.
  You can set the rarity of image, by adding '#1' after the image name.
  like 'image#1.png'.The higher the number, the more common image will be.
  HashLips example
  https://github.com/HashLips/hashlips_art_engine/tree/main/layers


- Go to the `src/config.js` and change 'layerConfigurations'. The order
  layer folders name in order of the back layer to the front layer.
  The `name` of each layer object represents the name of the folder (in `/layers/`) that the images reside in.
  You can have several 'layersOrder' in the same time, with different orders.

- Also, don't forget to substitute `address` for your wallet, if you are creating NFT for Solana
and change `const network` for  `NETWORK.sol`. 

- When you are ready, run the following command and your outputted art will be in the `build/images` directory and the json in the `build/json` directory:

```sh
npm run build
```
- 

- Go to `https://app.pinata.cloud/pinmanager` and Pin images folder 
from `build/images`
(if the folder has a huge size, better download images to Ipfs desktop at first, and then pin it by CID)
You can use another platform, for more information go to:
https://gitlab.devlits.com/cryptolits/solidity/documentation/-/tree/ipfs_prices

- Copy CID of the images folder,and put it in the `src/config.js` in `const BaseUri`
and run:
```sh
npm run update_info
```
- Then, delete _metadata.json from `json` folder. Go back to `https://app.pinata.cloud/pinmanager`
and download the `json` folder.

Now, your metadata is ready.