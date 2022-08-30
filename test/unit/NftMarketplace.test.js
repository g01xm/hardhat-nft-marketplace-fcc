const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Unit Tests", function () {
          let NftMarketplace, basicNft, deployer, player, playerConnectedNftMarketplace
          const PRICE = ethers.utils.parseEther("0.1")
          const NEW_PRICE = ethers.utils.parseEther("0.2")
          const TOKEN_ID = 0

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              //   player = (await getNamedAccounts()).player
              const accounts = await ethers.getSigners()
              player = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplace = await ethers.getContract("NftMarketplace", deployer)
              basicNft = await ethers.getContract("BasicNft", deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
              playerConnectedNftMarketplace = await nftMarketplace.connect(player)
          })

          describe("list items and buy items", function () {
              // IERC721 nft = IERC721(nftAddress);
              // if (nft.getApproved(tokenId) != address(this)) {
              //     revert NftMarketplace_NotApprovedForMarketplace();
              // }

              it("test not approved, will be revert if it is not approved", async function () {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace_NotApprovedForMarketplace")
              })

              it("test notlisted, will be revert if it is already listed", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace_Alreadylisted")
              })

              it("test only owner can list, will be revert if it is not owner", async function () {
                  await expect(
                      playerConnectedNftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace_NotOwner")
              })

              it("test price not above 0, will be revert if it is not", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, "0")
                  ).to.be.revertedWith("NftMarketplace_PriceMustBeAboveZero")
              })

              it("test emit event after listed", async function () {
                  await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      nftMarketplace,
                      "ItemListed"
                  )
              })

              it("test islisted, only can be bought after listed", async function () {
                  await expect(
                      playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace_Notlisted")
              })

              it("lists and can be bought, list delete after bought, and bought event emit", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.emit(playerConnectedNftMarketplace, "ItemBought")
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer)
                  const listingItem = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(newOwner.toString() == player.address)
                  assert(deployerProceeds.toString() == PRICE.toString())
                  assert(listingItem.price.toString() == "0")
              })
          })

          describe("cancel list and update list", function () {
              it("lists can be canceled, only owner can cancel the list, can be canceled only if it is listed and cancel event emited", async function () {
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace_Notlisted")

                  await expect(
                      playerConnectedNftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace_NotOwner")

                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  await expect(nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      nftMarketplace,
                      "ItemCanceled"
                  )
                  await expect(
                      playerConnectedNftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace_NotOwner")

                  const listingItem = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  //   console.log(listingItem)
                  assert(listingItem.price.toString() == "0")
              })

              it("lists can be update, only owner can udpate the list, can be update only if it is listed and update event emited", async function () {
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, NEW_PRICE)
                  ).to.be.revertedWith("NftMarketplace_Notlisted")

                  await expect(
                      playerConnectedNftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          NEW_PRICE
                      )
                  ).to.be.revertedWith("NftMarketplace_NotOwner")

                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, NEW_PRICE)
                  ).to.emit(nftMarketplace, "ItemListed")

                  await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, NEW_PRICE)
                  const newPrice = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(newPrice.price.toString() == NEW_PRICE.toString())
              })
          })

          describe("test withdrawProceeds", function () {
              it("it can withdrawProceeds", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })

                  await nftMarketplace.withdrawProceeds()
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer)

                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
                      "NftMarketplace_NoProceeds"
                  )

                  assert(deployerProceeds.toString() == "0")
              })
          })
      })
