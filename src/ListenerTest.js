require("dotenv").config();
const ethers = require("ethers");
const axios = require("axios");
const Contract = require("./utils/Contract");

const provider = new ethers.providers.JsonRpcProvider(
  `${process.env.PROVIDER_MAINNET_HTTPS}`
);
const ABIBUSD = require("../ABI/busd.json");
const BUSD = new ethers.Contract(process.env.BUSD_ADDRESS, ABIBUSD, provider);

// URL to POST events
const endPointPostEvents = process.env.API_URL;
async function ListenerTransferTestBUSD() {
  // Events list to listen to:
  // BUSD Smart contract
  BUSD.on("Transfer", async (from, to, amount, extraData) => {
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

    console.log(eventData);
    try {
      const response = await axios.post(
        `${endPointPostEvents}Transfer/`,
        eventData
      );

      if (response.status === 200) {
        console.log("You posted a listing!");
      } else {
        console.log("Failed to post listing. Status code:", response.status);
      }
    } catch (error) {
      console.error("Error posting event data:", error);
      //TODO: Handle error appropriately, e.g. retrying failed requests, sending an alert to developers, etc.
    }
  });
}

async function SyncListenerTransferTestBUSD(fromBlockNumber) {
  const actualBlockNumber = await provider.getBlockNumber();

  const events = await BUSD.queryFilter(
    "Transfer",
    fromBlockNumber - actualBlockNumber,
    actualBlockNumber - 1
  );
  console.log("EVENT", events);

  for (let i = 0; i < events.length; i++) {
    const amountHex = events[i].args[2]._hex;

    const eventData = {
      eventName: events[i].event,
      from: events[i].args.from,
      to: events[i].args.to,
      amount: parseInt(amountHex, 16),
      transactionHash: events[i].transactionHash,
      blockNumber: events[i].blockNumber,
    };
    console.log(eventData);

    try {
      const response = await axios.post(
        `${endPointPostEvents}Transfer/`,
        eventData
      );
      if (response.status === 200) {
        console.log("You posted a listing!");
      } else {
        console.log("Failed to post listing. Status code:", response.status);
      }
    } catch (error) {
      console.error("Error posting event data:", error);
      //TODO: Handle error appropriately, e.g. retrying failed requests, sending an alert to developers, etc.
    }
  }
}

module.exports = { ListenerTransferTestBUSD, SyncListenerTransferTestBUSD };
