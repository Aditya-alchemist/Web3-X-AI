import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

const CONTRACT_ADDRESS = '0xdb8cd7478ebb88f6551cc3534f2db1c3caa3035a';
const CONTRACT_ABI = [
  "function tip() public payable",
  "function getbalance() public view returns (uint256)",
  "event Tipped(address indexed from, uint256 amount, uint256 timestamp)"
];

const TipJar = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);

  // Generate AI thank you message using Gemini API
  const generateAIThankYouMessage = async (amount, fromAddress) => {
    setIsGeneratingMessage(true);
    
    try {
      const prompt = `Generate a creative, heartfelt, and unique thank you message for someone who just sent a tip of ${amount} ETH to my tip jar smart contract. 

      Context:
      - Tip amount: ${amount} ETH
      - Sender address: ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}
      - This is for a blockchain tip jar application
      
      Requirements:
      - Keep it under 150 characters
      - Make it warm, genuine, and appreciative
      - Include relevant emojis
      - Make it feel personal and special
      - Can reference the blockchain/crypto context subtly
      - Should feel celebratory and grateful
      
      Generate only the message, no additional text or formatting.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const message = data.candidates[0].content.parts[0].text.trim();
        return message;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Error generating AI message:', error);
      // Fallback to a simple thank you message if API fails
      return `🙏 Thank you so much for your generous ${amount} ETH tip! Your support means the world to us! ✨`;
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        setAccount(accounts[0]);

        await getBalance(contract);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Get contract balance
  const getBalance = async (contractInstance = contract) => {
    if (contractInstance) {
      try {
        const balance = await contractInstance.getbalance();
        setBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error('Error getting balance:', error);
      }
    }
  };

  // Send tip
  const sendTip = async () => {
    if (!contract || !tipAmount) return;

    setIsLoading(true);
    try {
      const tx = await contract.tip({
        value: ethers.parseEther(tipAmount)
      });
      
      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Generate AI thank you message
      const aiMessage = await generateAIThankYouMessage(tipAmount, account);
      setThankYouMessage(aiMessage);
      setShowThankYou(true);
      
      // Update balance
      await getBalance();
      
      // Clear tip amount
      setTipAmount('');
      
      // Hide thank you message after 10 seconds
      setTimeout(() => {
        setShowThankYou(false);
      }, 10000);
      
    } catch (error) {
      console.error('Error sending tip:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for tip events
  useEffect(() => {
    if (contract) {
      const filter = contract.filters.Tipped();
      
      contract.on(filter, (from, amount, timestamp) => {
        console.log('Tip received:', {
          from,
          amount: ethers.formatEther(amount),
          timestamp: new Date(Number(timestamp) * 1000)
        });
        getBalance();
      });

      return () => {
        contract.removeAllListeners();
      };
    }
  }, [contract]);

  return (
    <div className="tip-jar-container">
      <div className="tip-jar-card">
        <h1 className="title">💰 AI-Powered Tip Jar</h1>
        <p className="subtitle">Support us and get a personalized AI thank you message!</p>

        {!account ? (
          <button className="connect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className="connected-section">
            <p className="account">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <p className="balance">Contract Balance: {balance} ETH</p>

            <div className="tip-section">
              <input
                type="number"
                step="0.001"
                placeholder="Amount in ETH"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="tip-input"
                disabled={isLoading}
              />
              <button 
                className="tip-btn" 
                onClick={sendTip}
                disabled={isLoading || !tipAmount}
              >
                {isLoading ? 'Sending Tip...' : 'Send Tip 🚀'}
              </button>
            </div>

            {/* Show API key status */}
            {!process.env.REACT_APP_GEMINI_API_KEY && (
              <p className="api-warning">⚠️ Gemini API key not configured</p>
            )}
          </div>
        )}

        {/* Thank You Message Modal */}
        {showThankYou && (
          <div className="thank-you-modal">
            <div className="thank-you-content">
              <button 
                className="close-btn"
                onClick={() => setShowThankYou(false)}
              >
                ×
              </button>
              
              {isGeneratingMessage ? (
                <div className="generating-message">
                  <div className="spinner"></div>
                  <p>🤖 Gemini AI is crafting your personalized thank you message...</p>
                </div>
              ) : (
                <div className="thank-you-message">
                  <div className="ai-badge">✨ Generated by Gemini AI ✨</div>
                  {thankYouMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TipJar;
