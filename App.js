require("dotenv").config();

const express = require("express");
const { Listeners } = require("./src/Listener");
const { Sync } = require("./src/Sync");
const {
  ListenerTransferTestBUSD,
  SyncListenerTransferTestBUSD,
} = require("./src/ListenerTest");
// const { SyncEvents } = require("../Sync");

const PORT = process.env.PORT || 3000;
const app = express();

const endPointPostEvents = process.env.API_URL;

app.post(`/Transfer/`, (req, res) => {
  console.log("Event received");
  // console.log(req);
  // console.log(res);
});

const fromBlockNumber = "29217627"; // Add blockNumber to Query from

app.listen(PORT, async (error) => {
  if (!error) {
    console.log(`Server running on http://localhost:${PORT}`);

    // BUSD Testing Event (mainnet)
    // Sync past events
    // await SyncListenerTransferTestBUSD(fromBlockNumber);
    // // List new events
    // await ListenerTransferTestBUSD();

    // G4AL Events (testnet)
    Sync.ListenerMarketPlaceSelltoken(fromBlockNumber); // Sync
    Listeners.ListenerMarketPlaceSelltoken(); // List new events

    Sync.ListenerMarketPlaceBuyToken(fromBlockNumber); // Sync past events
    Listeners.ListenerMarketPlaceBuyToken(); // List new events

    Sync.ListenerMarketPlaceRemoveToken(fromBlockNumber); // Syn past events
    Listeners.ListenerMarketPlaceRemoveToken(); // List new events

    Sync.ListenerSkillTransfer(fromBlockNumber); // Sync past events
    Listeners.ListenerSkillTransfer(); // List new events

    Sync.ListenerSkinTransfer(fromBlockNumber); // Sync past events
    Listeners.ListenerSkinTransfer(); // List new events
  } else {
    console.log(`Error ocurred, server cannot start: ${error}`);
  }
});
