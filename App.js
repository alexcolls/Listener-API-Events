require("dotenv").config();

const express = require("express");
const Listener = require("./src/listener");
const { ListenerTransferTestBUSD } = require("./src/ListenerTest");
const { SyncEvents } = require("../Sync");

const PORT = process.env.PORT || 3000;
const app = express();

const endPointPostEvents = process.env.URL_POST_EVENTS;

app.post(`/Transfer/`, (req, res) => {
  // console.log("Transfer event received");
});

app.listen(PORT, async (error) => {
  if (!error) {
    console.log(`Server running on http://localhost:${PORT}`);
    // Listeners(); // Testnet Marketplace & NFTs Collections
    // await SyncEvents();

    // BUSD Testing Event (mainnet)
    ListenerTransferTestBUSD(); // Mainnet BUSD (Testing)

    // G4AL Events (testnet)
    // Listener.ListenerMarketPlaceSelltoken();
    // Listener.ListenerMarketPlaceBuyToken();
    // Listener.ListenerMarketPlaceRemoveToken();
    // Listener.ListenerSkillTransfer();
    // Listener.ListenerSkinTransfer();
  } else {
    console.log(`Error ocurred, server cannot start: ${error}`);
  }
});
