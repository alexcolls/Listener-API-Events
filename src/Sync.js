require("dotenv").config();
const ethers = require("ethers");
const axios = require("axios");
const Contract = require("./utils/Contract");
const { myprog } = require("../MailGun/sendInfoMail");

// URL to POST events
const endPointPostEvents = process.env.API_URL;

// Instance provider
const provider = new ethers.providers.JsonRpcProvider(
  `${process.env.PROVIDER_TESTNET_HTTPS}`
);

const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Instance Smart Contracts
const marketPlaceSC = new ethers.Contract(
  process.env.MARKETPLACE_ADDRESS,
  Contract.getABI("marketplace"),
  provider
);
const skinSC = new ethers.Contract(
  process.env.SKIN_ADDRESS,
  Contract.getABI("skill"),
  provider
);
const skillSC = new ethers.Contract(
  process.env.SKILL_ADDRESS,
  Contract.getABI("skin"),
  provider
);

const Sync = {
  // MARKETPLACE
  async ListenerMarketPlaceSelltoken(fromBlockNumber) {
    const actualBlockNumber = await provider.getBlockNumber();

    const events = await marketPlaceSC.queryFilter(
      "SellToken",
      fromBlockNumber - actualBlockNumber,
      actualBlockNumber - 1
    );

    for (let i = 0; i < events.length; i++) {
      let amountHex = events[i].args[2]._hex;
      let priceHex = events[i].args[3]._hex;

      let eventData = {
        eventName: events[i].event,
        collectionNFT: events[i].args[0],
        tokenId: parseInt(events[i].args[1]._hex, 16),
        amount: parseInt(amountHex, 16),
        price: parseInt(priceHex, 16),
        isDollar: events[i].args[4],
        seller: events[i].args[5],
        transactionHash: events[i].transactionHash,
        blockNumber: events[i].blockNumber,
      };

      console.log(eventData);

      try {
        let response = await axios.post(
          `${endPointPostEvents}SellToken/`,
          eventData
        );

        if (response.status == "200") {
          console.log("You posted a SellToken!");
        } else {
          console.log(
            "Failed to post SellToken. Status code:",
            response.status
          );
        }
      } catch (error) {
        console.error("Error posting event data:", error);
        let data = {
          from: "gamesforaliving@g4al.com",
          to: "cricharte@g4al.com",
          subject: "(Synced Event) SellToken Error",
          text: `${error}`,
        };
        myprog.sendInfoMail(
          data.subject,
          data.text,
          data.from,
          data.to,
          data.subject
        );
      }
    }
  },

  async ListenerMarketPlaceBuyToken(fromBlockNumber) {
    const actualBlockNumber = await provider.getBlockNumber();

    const events = await marketPlaceSC.queryFilter(
      "BuyToken",
      fromBlockNumber - actualBlockNumber,
      actualBlockNumber - 1
    );
    for (let i = 0; i < events.length; i++) {
      let tokenIdHex = events[i].args[1]._hex;
      let amountHex = events[i].args[2]._hex;
      let priceHex = events[i].args[3]._hex;
      let revenueHex = events[i].args[4]._hex;
      let royaltiesHex = events[i].args[5]._hex;

      let eventData = {
        eventName: events[i].event,
        collectionNFT: events[i].args[0],
        tokenId: parseInt(tokenIdHex, 16),
        amount: parseInt(amountHex, 16),
        price: parseInt(priceHex, 16),
        sellerRevenue: parseInt(revenueHex, 16),
        royalties: parseInt(royaltiesHex, 16),
        seller: events[i].args[6],
        buyer: events[i].args[7],
        transactionHash: events[i].transactionHash,
        blockNumber: events[i].blockNumber,
      };

      console.log(eventData);

      try {
        let response = await axios.post(
          `${endPointPostEvents}BuyToken/`,
          eventData
        );

        if (response.status === 200) {
          console.log("You posted a BuyToken!");
        } else {
          console.log("Failed to post BuyToken. Status code:", response.status);
        }
      } catch (error) {
        console.error("Error posting event data:", error);
        let data = {
          from: "gamesforaliving@g4al.com",
          to: "cricharte@g4al.com",
          subject: "(Synced Event) BuyToken Error",
          text: `${error}`,
        };
        myprog.sendInfoMail(
          data.subject,
          data.text,
          data.from,
          data.to,
          data.subject
        );
      }
    }
  },

  async ListenerMarketPlaceRemoveToken(fromBlockNumber) {
    const actualBlockNumber = await provider.getBlockNumber();

    const events = await marketPlaceSC.queryFilter(
      "RemoveToken",
      fromBlockNumber - actualBlockNumber,
      actualBlockNumber - 1
    );

    for (let i = 0; i < events.length; i++) {
      let tokenIdHex = events[i].args[2]._hex;

      for (let i = 0; i < events.length; i++) {
        let eventData = {
          eventName: events[i].event,
          collection: events[i].args[0],
          tokenId: parseInt(tokenIdHex, 16),
          seller: events[i].args[1],
          transactionHash: events[i].transactionHash,
          blockNumber: events[i].blockNumber,
        };

        console.log(eventData);

        //TODO: DELETE  where?
        try {
          let response = await axios.delete(
            `${endPointPostEvents}Removetoken/`,
            eventData
          );

          if (response.status === 200) {
            console.log("You posted a RemoveToken!");
          } else {
            console.log(
              "Failed to post RemoveToken. Status code:",
              response.status
            );
          }
        } catch (error) {
          console.error("Error posting event data:", error);
          let data = {
            from: "gamesforaliving@g4al.com",
            to: "cricharte@g4al.com",
            subject: "(Synced Event) RemoveToken Error",
            text: `${error}`,
          };
          myprog.sendInfoMail(
            data.subject,
            data.text,
            data.from,
            data.to,
            data.subject
          );
        }
      }
    }
  },
  // Skill Smart contract (Remove Token from listing if transferred)
  async ListenerSkillTransfer(fromBlockNumber) {
    const actualBlockNumber = await provider.getBlockNumber();

    const events = await skillSC.queryFilter(
      "Transfer",
      fromBlockNumber - actualBlockNumber,
      actualBlockNumber - 1
    );

    // Check if each token ID transferred found is on sale
    for (let i = 0; i < events.length; i++) {
      let tokenIdHex = events[i].args[2];

      let Sale = await marketPlaceSC.tokensForSale(
        skinSC.address, //SC address
        parseInt(tokenIdHex, 16), // From tokenID
        events[i].args[0] // Seller address
      );

      // console.log("SALE:", Sale);
      // console.log("EVENTS:", events);
      // Check if the transfer is because of minting a new token (Sender is 0x)
      if (events[i].args[0] !== "0x0000000000000000000000000000000000000000") {
        // Check if the amount is 0 (It means there is not any token on sale)
        if (Sale.amount._hex !== "0x00") {
          try {
            console.log(`Skill Token transfer found in Sale! Removing.. `);
            // await marketPlaceSC
            //   .connect(signer)
            //   .removeToken(events[i].address, parseInt(tokenIdHex, 16));
            const tx = {
              from: signer.address, // specify the sender
              to: marketPlaceSC.address,
              gasLimit: 210000, // set the gas limit to 210,000
              gasPrice: ethers.utils.parseUnits("5", "gwei"), // set the gas price to 5 Gwei
              nonce: (await provider.getTransactionCount(signer.address)) + 1,
              data: marketPlaceSC.interface.encodeFunctionData("removeToken", [
                events[i].address,
                parseInt(tokenIdHex, 16),
              ]),
            };
            const signedTx = await signer.signTransaction(tx);
            console.log(
              "Transaction receipt sent and waiting to be confirmed:",
              signedTx
            );
            await provider.sendTransaction(signedTx);
          } catch (error) {
            console.error(
              `Error Removing Skill Token from Sale after listening "Transfer: "`,
              error
            );
            let data = {
              from: "gamesforaliving@g4al.com",
              to: "cricharte@g4al.com",
              subject: `(Synced Event) Error Removing Token from Sale after listening Skin - "Transfer Event"`,
              text: `${error}`,
            };
            myprog.sendInfoMail(
              data.subject,
              data.text,
              data.from,
              data.to,
              data.subject
            );
          }
        }
      }
    }
  },

  async ListenerSkinTransfer(fromBlockNumber) {
    const actualBlockNumber = await provider.getBlockNumber();

    const events = await skinSC.queryFilter(
      "Transfer",
      fromBlockNumber - actualBlockNumber,
      actualBlockNumber - 1
    );

    console.log("Transfer found in Skin!");
    // console.log(events);

    // Check if each token ID transferred found is on sale
    for (let i = 0; i < events.length; i++) {
      let tokenIdHex = events[i].args[2];

      let Sale = await marketPlaceSC.tokensForSale(
        skinSC.address, //SC address
        parseInt(tokenIdHex, 16), // From tokenID
        events[i].args[0] // Seller address
      );

      // console.log("SALE:", Sale);
      // console.log("EVENTS:", events[i]);

      // Check if the transfer is because of minting a new token (Sender is 0x)
      if (events[i].args[0] !== "0x0000000000000000000000000000000000000000") {
        // Check if the amount is 0 (It means there is not any token on sale)
        if (Sale.amount._hex !== "0x00") {
          try {
            console.log(`Skin Token transfer found in Sale! Removing.. `);
            // await marketPlaceSC
            //   .connect(signer)
            //   .removeToken(events[i].address, parseInt(tokenIdHex, 16));

            // Construct the transaction
            const tx = {
              from: signer.address, // specify the sender
              to: marketPlaceSC.address,
              gasLimit: 210000, // set the gas limit to 210,000
              gasPrice: ethers.utils.parseUnits("5", "gwei"), // set the gas price to 5 Gwei
              nonce: (await provider.getTransactionCount(signer.address)) + 1,
              data: marketPlaceSC.interface.encodeFunctionData("removeToken", [
                events[i].address,
                parseInt(tokenIdHex, 16),
              ]),
            };
            const signedTx = await signer.signTransaction(tx);
            console.log(
              "Transaction receipt sent and waiting to be confirmed:",
              signedTx
            );
            await provider.sendTransaction(signedTx);
            // console.log("Token removed from sale!");
          } catch (error) {
            console.error(
              `Error Removing Skin Token from Sale after listening "Transfer: "`,
              error.message
            );
            let data = {
              from: "gamesforaliving@g4al.com",
              to: "cricharte@g4al.com",
              subject: `(Synced Event) Error Removing Token from Sale after listening Skin - "Transfer Event"`,
              text: `${error}`,
            };
            myprog.sendInfoMail(
              data.subject,
              data.text,
              data.from,
              data.to,
              data.subject
            );
          }
        }
      }
    }
  },
};
module.exports = { Sync };
