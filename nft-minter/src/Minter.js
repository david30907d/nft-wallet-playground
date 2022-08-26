import { useEffect, useState } from "react";
import {
  connectWallet,
  getCurrentWalletConnected,
} from "./util/interact.js";
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY;
const web3 = createAlchemyWeb3(alchemyKey);
const contract = require("./PyConTwNFT.json");

const Minter = (props) => {
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");

  const [nfts, setNFTs] = useState({ "result": [] });
  const [NftDoms, setNftDoms] = useState(<p></p>);
  async function requestNftData() {
    const { address, status } = await getCurrentWalletConnected();

    setWallet(address);
    setStatus(status);
    addWalletListener();
    let resp = await fetch(`https://deep-index.moralis.io/api/v2/${address}/nft?chain=rinkeby&format=decimal`, {
      headers: new Headers({
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'X-API-Key': 'f7p5XanmDOcD2esKBevadHLJ40dU8MHQ2LtXKrhB5WX947zEkpRrFqCVS5rwgm1y'
      })
    });
    let respJson = await resp.json();
    respJson.result.map(async (nft) => {
      const nftContract = new web3.eth.Contract(contract.abi, nft.token_address);
      const result = await nftContract.methods.tokenURI(1).call();
    }
    )
    let tmpNftDoms = []
    for (const nft of respJson.result) {
      const tokenURI = await getTokenURI(nft)
      const resp = await fetch(`https://ipfs.io/${tokenURI}`.replace("ipfs:/", "ipfs/"))
      const imageURI = await resp.json()
      tmpNftDoms.push(
        <p key={nft.token_address}>
          <li>NFT address: {nft.token_address}</li>
          <li>Type: {nft.contract_type}</li>
          <img src={`https://ipfs.io/${imageURI.image}`.replace("ipfs:/", "ipfs/")} />
        </p>
      )
      setNftDoms(tmpNftDoms)
    }
    setNFTs(respJson);

  }
  useEffect(requestNftData, []);
  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus("👆🏽 Write a message in the text-field above.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
    } else {
      setStatus(
        <p>
          {" "}
          🦊{" "}
          <a target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      );
    }
  }

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
    console.log("connectWalletPressed!")
    requestNftData();
  };

  return (
    <div className="Minter">
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? (
          "Connected: " +
          String(walletAddress).substring(0, 6) +
          "..." +
          String(walletAddress).substring(38)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      {NftDoms}
    </div>
  );
};


async function getTokenURI(nft) {
  const nftContract = new web3.eth.Contract(contract.abi, nft.token_address);
  return await nftContract.methods.tokenURI(1).call();
}
export default Minter;
