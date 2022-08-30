const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")
const PRICE = ethers.utils.parseEther("0.1")

async function mintAndList() {
    // const { deployer } = await getNamedAccounts()
    const basicNft = await ethers.getContract("BasicNft")
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    console.log("minting basicNft...")

    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)

    const tokenId = mintTxReceipt.events[0].args.tokenId

    // console.log("mintTxReceipt is...")
    // console.log(mintTxReceipt)
    // console.log("mintTxReceipt events are...")
    // console.log(mintTxReceipt.events)
    // console.log("mintTxReceipt events 0 is...")
    // console.log(mintTxReceipt.events[0])
    // console.log("mintTxReceipt events 0 args is...")
    // console.log(mintTxReceipt.events[0].args)
    // console.log("mintTxReceipt events 0 args tokenid is...")
    // console.log(mintTxReceipt.events[0].args.tokenId)

    // console.log(mintTxReceipt.logs)

    console.log("Approving nft...")

    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approvalTx.wait(1)

    console.log("list Nft!")

    const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    const txReceipt = await tx.wait(1)
    // console.log(txReceipt)
    // console.log("the topic are ==============")
    // // console.log(txReceipt["events"][0].topics)
    // console.log(txReceipt.events[0].topics)
    console.log("Listed!")

    if (network.config.chainId == "31337") {
        await moveBlocks(2, (sleepAmout = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
