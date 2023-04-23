require("dotenv").config();
const ethers = require("ethers");
const axios = require("axios");
const Contract = require("./utils/Contract");

// URL to POST events
const endPointPostEvents = process.env.URL_POST_EVENTS;

// Instance provider
const provider = new ethers.providers.JsonRpcProvider(
  `${process.env.INFURA_TESTNET_API}`
);

// Smart Contracts
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
      (collection, tokenId, amount, price, isDollar, seller) => {
        let hex = amount.hex;
        const eventData = {
          eventName: "SellToken",
          collectionNFT: collection,
          tokenId: tokenId,
          amount: parseInt(hex, 16),
          price: ethers.utils.parseEther(price),
          isDollar: isDollar,
          seller: seller,
        };

        axios
          .post(`${endPointPostEvents}SellToken/`, eventData)
          .then((response) => {
            console.log("You posted a listing!");
          })
          .catch((error) => {
            console.log(error);
          });
      }
    );
  },

  async ListenerMarketPlaceBuyToken() {
    marketPlaceSC.on(
      "BuyToken",
      (
        collection,
        tokenId,
        amount,
        price,
        sellerRevenue,
        royalties,
        seller,
        buyer
      ) => {
        let hex = amount.hex;

        const eventData = {
          eventName: "BuyToken",
          collectionNFT: collection,
          tokenId: tokenId,
          amount: parseInt(hex, 16),
          price: ethers.utils.parseEther(price),
          sellerRevenue: sellerRevenue,
          royalties: royalties,
          seller: seller,
          buyer: buyer,
        };

        axios
          .post(`${endPointPostEvents}BuyToken/`, eventData)
          .then((response) => {
            console.log("You posted a purchase!");
          })
          .catch((error) => {
            console.log(error);
          });
      }
    );
  },

  async ListenerMarketPlaceRemoveToken() {
    marketPlaceSC.on("RemoveToken", (collection, tokenId, seller) => {
      const eventData = {
        eventName: "Removetoken",
        collection: collection,
        tokenId: tokenId,
        seller: seller,
      };

      axios
        .post(`${endPointPostEvents}RemoveToken/`, eventData)
        .then((response) => {
          console.log("You posted a Removed token!");
        })
        .catch((error) => {
          console.log(error);
        });
    });
  },
  async ListenerSkillTransfer() {
    // Skill Smart contract
    skillSC.on("Transfer", (from, to, tokenId) => {
      const eventData = {
        eventName: "Transfer",
        from: from,
        to: to,
        tokenId: tokenId,
      };

      axios
        .post(`${endPointPostEvents}Transfer/`, eventData)
        .then((response) => {
          console.log("You posted a removeToken!");
          // TODO: This should call the function removeToken() from listing
        })
        .catch((error) => {
          console.log(error);
        });
    });
  },
  async ListenerSkinTransfer() {
    // Skin Smart contract
    skinSC.on("Transfer", (from, to, tokenId) => {
      const eventData = {
        eventName: "Transfer",
        from: from,
        to: to,
        tokenId: tokenId,
      };

      axios
        .post(`${endPointPostEvents}Transfer/`, eventData)
        .then((response) => {
          console.log("You posted a removeToken!");
          // TODO: This should call the function removeToken() from listing
        })
        .catch((error) => {
          console.log(error);
        });
    });
  },
};

module.exports = Listeners;
