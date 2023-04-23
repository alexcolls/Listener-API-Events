require("dotenv").config();
const ethers = require("ethers");
const axios = require("axios");
const Contract = require("./utils/Contract");
// const { provider } = require("./utils/Provider");

const provider = new ethers.providers.JsonRpcProvider(
  `${process.env.BSC_MAINNET_API}`
);
const ABIBUSD = require("../ABI/busd.json");
const BUSD = new ethers.Contract(process.env.BUSD_MAINNET, ABIBUSD, provider);

// URL to POST events
const endPointPostEvents = process.env.URL_POST_EVENTS;

async function ListenerTransferTestBUSD() {
  // Instance contracts

  // Events list to listen to:

  // BUSD Smart contract
  BUSD.on("Transfer", (from, to, amount, extraData) => {
    const { _hex } = amount;
    const { transactionHash, blockNumber } = extraData;
    let amountDecimals = parseInt(_hex, 16);
    const eventData = {
      eventName: "Transfer",
      from: from,
      to: to,
      amount: amountDecimals,
      transactionHash: transactionHash,
      blockNumber: blockNumber,
    };

    axios
      .post(`${endPointPostEvents}Transfer/`, eventData, {
        // headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        console.log("POST REQUEST SUCCESSFULLY");
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

module.exports = { ListenerTransferTestBUSD };
