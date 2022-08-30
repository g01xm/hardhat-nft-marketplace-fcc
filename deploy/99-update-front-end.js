const { ethers, network } = require("hardhat")
const fs = require("fs")

const frontEndContractsFile = "../nextjs-nft-marketplace-fcc/constants/networkMapping.json"

const frontEndAbiLocation = "../nextjs-nft-marketplace-fcc/constants/"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

async function updateContractAddresses() {
    console.log("start Updating front end")
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    console.log(`the current NftMarketplace address is ${nftMarketplace.address}`)
    const chainId = network.config.chainId.toString()
    const currentAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))

    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId]["NftMarketplace"].includes(nftMarketplace.address)) {
            currentAddresses[chainId]["NftMarketplace"].push(nftMarketplace.address)
        }
    } else {
        currentAddresses[chainId] = { NftMarketplace: [nftMarketplace.address] }
    }

    fs.writeFileSync(frontEndContractsFile, JSON.stringify(currentAddresses))
    console.log(`the new address is ${JSON.stringify(currentAddresses)}`)
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")

    fs.writeFileSync(
        `${frontEndAbiLocation}NftMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )
    const basicNft = await ethers.getContract("BasicNft")

    fs.writeFileSync(
        `${frontEndAbiLocation}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

module.exports.tags = ["all", "frontend"]
