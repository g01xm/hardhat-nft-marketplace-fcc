const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mint() {
    const basicNft = await ethers.getContract("BasicNft")
    console.log("minting basicNft...")

    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log(`got tokenID: ${tokenId}`)
    console.log(`NFT ADDRESS: ${basicNft.address}`)

    if (network.config.chainId == "31337") {
        await moveBlocks(2, (sleepAmout = 1000))
    }
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
