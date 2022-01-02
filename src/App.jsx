import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import contractDefinition from "./utils/VibeSender.json"

import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

export default function App() {
  /*
  * Just a state variable we use to store our user's public wallet.
  */
  const [currentAccount, setCurrentAccount] = useState("");
  /*
   * All state property to store all waves
   */
  const [allVibes, setAllVibes] = useState([]);

  const [vibeScoreResultMessage, setVibeScoreResultMessage] = useState("Not calculated.")
  const [vibeScoreResultNum, setVibeScoreResultNum] = useState("")

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0x2D3d9Fe3598Dc2317C61947A46d87a2cf454e389";
  const contractABI = contractDefinition.abi

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllVibes()
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const getVibeScore = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const vibeSenderContract = new ethers.Contract(contractAddress, contractABI, signer);

        let score = await vibeSenderContract.getMyVibeScore();
        let numScore = score.toNumber()
        if (numScore > 0) {
            setVibeScoreResultMessage(`Score: ${numScore}, You are definitely a nice person, plz dont change 😘`);
        }
        else if (numScore < 0) {
            setVibeScoreResultMessage(`Score: ${numScore}, Yooo chill, nobody is going to like you with that attitude 😡`);
        }
        else {
            setVibeScoreResultMessage(`Score: ${numScore}, I am not sure about you 🤔`);
        }
        setVibeScoreResultNum(numScore)
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const sendVibe = isGood => async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const vibeSenderContract = new ethers.Contract(contractAddress, contractABI, signer);
        console.log("Sending vibe with message:", messageText)
        /*
        * Execute the actual wave from your smart contract
        */
        const vibeTxn = await vibeSenderContract.sendVibe(messageText, isGood, { gasLimit: 300000 });
        console.log("Mining...", vibeTxn.hash);

        // Hide the emoji picker
        setShowEmojiPicker(false);

        await vibeTxn.wait();
        console.log("Mined -- ", vibeTxn.hash);

        // Lets update the vibes block
        // getAllVibes();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllVibes = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const vibeSenderContract = new ethers.Contract(contractAddress, contractABI, signer);

        const vibes = await vibeSenderContract.getAllVibes();
        
        let vibesCleaned = [];
        vibes.forEach(vibe => {
          vibesCleaned.push({
            address: vibe.viber,
            timestamp: new Date(vibe.timestamp * 1000),
            isGood: vibe.isGood,
            message: vibe.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllVibes(vibesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
 * Listen in for emitter events!
 */
useEffect(() => {
  let vibeSenderContract;

  const onNewVibe = (from, timestamp, isGood, message) => {
    console.log('NewVibe', from, timestamp, isGood, message);
    setAllVibes(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        isGood: isGood,
        message: message
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    vibeSenderContract = new ethers.Contract(contractAddress, contractABI, signer);
    vibeSenderContract.on('NewVibe', onNewVibe);
  }

  return () => {
    if (vibeSenderContract) {
      vibeSenderContract.off('NewVibe', onNewVibe);
    }
  };
}, []);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [messageText, setMessageText] = useState("")

  const onVibeMessageFocusChange = showStatus => () => {
    if (messageText.length <= 10) {
      setShowEmojiPicker(showStatus);
    }
  }

  const handleInputChange = (e) => () => {
    this.setState({ input: e.target.value });
  }

  const appendEmoji = (emoji) => {
    if (messageText.length == 10) {
      setShowEmojiPicker(false)
    }
    if (messageText.length <= 10) {
      setMessageText( messageText + emoji.native );
    }
  }

  const clearInput = () => {
    setMessageText("")
    setShowEmojiPicker(true)
  }

  const EmojiPicker = () => <Picker set='apple' theme="dark" onSelect={appendEmoji} showPreview={false} title={""} onBlur={onVibeMessageFocusChange(false)} />
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        Hello Stranger! 👽
        </div>

        <div className="bio">
        This is a web3 app to send good or bad vibes through the Etherum blockchain, pretty cool right?.
        <br/>
        </div>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="vibeButton" onClick={connectWallet}>
            Connect Wallet 🦊
          </button>
        )}

        <div className="formContainer">
          <br/>
          Instructions:
           <br/>
           Tell us how your day is going in 6 or less emojis
           <br/>
           (Click the input to show a fancy emoji picker)
           <br/>
          <input className="vibeMessage" type="text" onFocus={onVibeMessageFocusChange(true)} value={messageText} onChange={handleInputChange} />
          <button className="vibeButton" onClick={clearInput}>
            clear
          </button>
          <br/>
          Click the type of vibe (🤙 = good, 🖕 = bad) to send the vibe and your message.
          <br/>
          <button className="vibeButton" onClick={sendVibe(true)}>
            🤙
          </button>
          <button className="vibeButton" onClick={sendVibe(false)}>
            🖕
          </button>
        </div>

        <div className="emojiPicker">
          {showEmojiPicker ? <EmojiPicker /> : null}
        </div>

        <div className="warning">
        Be careful btw, vibes accumulate and make your vibe score that its kept forever in the blockchain! 👻
        <br/>
          <button className="vibeButton" onClick={getVibeScore}>
            😇 Check your vibe score 😈
          </button>
        </div>

        <div className="vibeScoreResult">
          Vibe Score:
          <br/>
          {vibeScoreResultMessage}
          <br/>
          Score &gt; 0 = 🙂, Score = 0 = 😐, Score &lt; 0 = 🙁
        </div>

        {allVibes.map((vibe, index) => {
          return (
            <div key={index} className="vibeBlock">
              <div>Address: {vibe.address}</div>
              <div>Time: {vibe.timestamp.toString()}</div>
              <div>Vibe Type: {vibe.isGood? "🙌" : "💩"}</div>
              <div>Message: {vibe.message}</div>
            </div>)
        })}

        <div className="footer">
          Built with 🦄 <strong>buildspace</strong>
        </div>
      </div>
    </div>
  );
}
