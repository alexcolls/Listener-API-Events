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

const Listeners = {
  async ListenerMarketPlaceSelltoken() {
    // Instance contracts

    // Events list to listen to:

    // Marketplace Smart contract
    marketPlaceSC.on(
      "SellToken",
      async (collection, tokenId, amount, price, isDollar, seller, event) => {
        const { transactionHash, blockNumber } = event;
        const { _hex } = amount;
        let amountDecimals = parseInt(_hex, 16);

        const eventData = {
          eventName: "SellToken",
          collectionNFT: collection,
          tokenId: tokenId,
          amount: amountDecimals,
          price: ethers.utils.parseEther(price),
          isDollar: isDollar,
          seller: seller,
          transactionHash: transactionHash,
          blockNumber: blockNumber,
        };
        console.log(eventData);

        try {
          const response = await axios.post(
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
          const data = {
            from: "gamesforaliving@g4al.com",
            to: "cricharte@g4al.com",
            subject: "(New event) SellToken Error",
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
    );
  },

  async ListenerMarketPlaceBuyToken() {
    marketPlaceSC.on(
      "BuyToken",
      async (
        collection,
        tokenId,
        amount,
        price,
        sellerRevenue,
        royalties,
        seller,
        buyer,
        event
      ) => {
        const { transactionHash, blockNumber } = event;

        const { _hex } = amount;
        let amountDecimals = parseInt(_hex, 16);

        const eventData = {
          eventName: "BuyToken",
          collectionNFT: collection,
          tokenId: tokenId,
          amount: amountDecimals,
          price: ethers.utils.parseEther(price),
          sellerRevenue: sellerRevenue,
          royalties: royalties,
          seller: seller,
          buyer: buyer,
          transactionHash: transactionHash,
          blockNumber: blockNumber,
        };
        console.log(eventData);

        try {
          const response = await axios.post(
            `${endPointPostEvents}BuyToken/`,
            eventData
          );

          if (response.status === 200) {
            console.log("You posted a BuyToken!");
          } else {
            console.log(
              "Failed to post BuyToken. Status code:",
              response.status
            );
          }
        } catch (error) {
          console.error("Error posting event data:", error);
          const data = {
            from: "gamesforaliving@g4al.com",
            to: "cricharte@g4al.com",
            subject: "(New event) BuyToken Error",
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
    );
  },

  async ListenerMarketPlaceRemoveToken() {
    marketPlaceSC.on(
      "RemoveToken",
      async (collection, tokenId, seller, event) => {
        const { transactionHash, blockNumber } = event;

        const eventData = {
          eventName: "Removetoken",
          collection: collection,
          tokenId: tokenId,
          seller: seller,
          transactionHash: transactionHash,
          blockNumber: blockNumber,
        };

        console.log(eventData);

        try {
          //TODO: DELETE  where?
          const response = await axios.delete(
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
          const data = {
            from: "gamesforaliving@g4al.com",
            to: "cricharte@g4al.com",
            subject: "(New event) RemoveToken Error",
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
    );
  },
  async ListenerSkillTransfer() {
    // Skill Smart contract
    skillSC.on("Transfer", async (from, to, tokenId, event) => {
      const Sale = await marketPlaceSC.getOnSaleTokenIds(
        skillSC.address, //SC address
        parseInt(tokenId, 16), // From tokenID
        from // Seller address
      );

      console.log("Transfer found in Skill!");

      // Check if the transfer is because of minting a new token (Sender is 0x)
      if (from !== "0x0000000000000000000000000000000000000000") {
        // Check if the amount is 0 (It means there is not any token on sale)
        if (Sale.amount._hex !== "0x00") {
          try {
            console.log(`Token found in Sale! `, Sale);
            await marketPlaceSC
              .connect(signer)
              .removeToken(skillSC.address, parseInt(tokenId, 16));
          } catch (error) {
            console.error(
              `Error Removing Token from Sale after listening "Transfer: "`,
              error
            );
            const data = {
              from: "gamesforaliving@g4al.com",
              to: "cricharte@g4al.com",
              subject: `(New event) Error Removing Token from Sale after listening Skill - "Transfer Event"`,
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
    });
  },
  async ListenerSkinTransfer() {
    // Skin Smart contract
    skinSC.on("Transfer", async (from, to, tokenId, event) => {
      const Sale = await marketPlaceSC.getOnSaleTokenIds(
        skinSC.address, //SC address
        parseInt(tokenId, 16), // From tokenID
        from // Seller address
      );

      console.log("Transfer found in Skin!");

      // Check if the transfer is because of minting a new token (Sender is 0x)
      if (from !== "0x0000000000000000000000000000000000000000") {
        // Check if the amount is 0 (It means there is not any token on sale)
        if (Sale.amount._hex !== "0x00") {
          try {
            console.log(`Token found in Sale! `, Sale);
            await marketPlaceSC
              .connect(signer)
              .removeToken(skinSC.address, parseInt(tokenId, 16));
          } catch (error) {
            console.error(
              `Error Removing Token from Sale after listening "Transfer: "`,
              error
            );
            const data = {
              from: "gamesforaliving@g4al.com",
              to: "cricharte@g4al.com",
              subject: `(New event) Error Removing Token from Sale after listening Skin - "Transfer Event"`,
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
    });
  },
};

module.exports = { Listeners };
