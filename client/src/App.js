import { useEffect, useState } from "react";
import Home from './components/Home'
import Play from './components/Play'
import Inventory from './components/Inventory'
import LeaderBoard from './components/LeaderBoard'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { hooks as metaMaskHooks } from "./connectors/metaMask";
import {
  hooks as walletConnectHooks
} from "./connectors/walletConnect";
import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'

const {
  useChainId: useChainIdW,
  useError: useErrorW,
  useProvider: useProviderW,
} = walletConnectHooks;

const { useChainId, useError, useProvider } = metaMaskHooks;

const LIST_ROUTE = [
  {
    path: "/",
    render: Home
  },
  {
    path: "/leader-board",
    render: LeaderBoard
  },
  {
    path: "/play",
    render: Play
  },
  {
    path: "/inventory",
    render: Inventory
  }
]


function App() {
  const [walletData, setWalletData] = useState()
  const [route, setRoute] = useState("/")
  const [userData, setUserData] = useState()
  let Component = LIST_ROUTE.find((item) => item.path === route)
  const provider = useProvider();
  const providerW = useProviderW();

  const errorW = useErrorW();
  const error = useError();

  const chainId = useChainId();
  const chainIdW = useChainIdW();

  function setGlobalUserData(data) {
    if (!data) {
      setUserData(undefined)
      localStorage.removeItem('user-data')
    } else {
      setUserData(prev => {
        let formatData = {
          ...prev,
          ...data
        }
        localStorage.setItem('user-data', JSON.stringify(formatData))
        return formatData
      })
    }
  }

  useEffect(() => {
    if (chainId && chainId != 97) {
      localStorage.setItem("METAMASK_CONNECT", "");
      localStorage.setItem("WALLET_CONNECT", "");

      setWalletData(null);
      toast.error("Wrong network");
    }
  }, [chainId, chainIdW]);
  //show error
  useEffect(() => {
    if (error) {
      console.log("bug metamask");
      console.log("error.name: ", error.name);

      if (error.message === "MetaMask not installed") {
        toast.error("MetaMask not installed")
        return;
      }
      toast.error(error.message);
    }
    if (errorW) {
      toast.error(errorW.message);
    }
  }, [error, errorW]);

  /// get signer
  useEffect(() => {
    const getSigner = async () => {
      try {
        if (provider || providerW) {
          if (provider && chainId === 97) {
            // console.log("Provider", provider);
            if (provider) {
              await provider
                .send("eth_requestAccounts", [])
                .then((data) => {
                  console.log("address: " + data);
                })
                .catch((error) => {
                  if (error.code === 4001) {
                    console.log("Please connect to MetaMask.");
                  } else {
                    console.error(error);
                  }
                });
              const signer = provider.getSigner(
                provider?.provider?.selectedAddress
              ); // You have to define your address to get away of error, because in first sight, it doesn't know what address should I sign
              setWalletData(signer);
              localStorage.setItem("METAMASK_CONNECT", "true");
              localStorage.setItem("WALLET_CONNECT", "");
            }
            return;
          }

          if (providerW && chainIdW === 97) {
            await providerW.send("eth_requestAccounts", []);
            if (providerW) {
              const signer = providerW.getSigner();
              setWalletData(signer);
              localStorage.setItem("METAMASK_CONNECT", "");
              localStorage.setItem("WALLET_CONNECT", "true");
            }
            return;
          }
        } else {
          setWalletData(null);
        }
      } catch (err) {
        console.log(err);
      }
    };

    getSigner();
  }, [provider, providerW, chainId, chainIdW]);

  // useEffect(() => {
  //   async function init() {
  //     const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545")
  //     const signer = new ethers.Wallet(
  //       "d2d8688f0394ccd2f8cf00a7f58197a304ccecfc037966056fd1e6e224596aea",
  //       provider
  //     );
  //     const smartcontract = new ethers.Contract(
  //       FishTokenInstance.networks[chainId].address,
  //       FishTokenInstance.abi, signer
  //     );
  //     let balanceOf = await smartcontract.approve('0x5C7D6b11B0a3AC8BcD587741a3495004309265a6', ethers.utils.parseEther('1'))
  //     await balanceOf.wait(1)
  //     console.log(balanceOf);
  //   }
  //   if (walletData) {
  //     init()
  //   }
  // }, [walletData])

  return (
    <>
      <div className="info-user">
        <div>
          {`Address:  ${walletData?._address ? walletData?._address : ""}`}
        </div>
        <div>
          {`FdT Point Balance:  ${userData?.balance ? userData?.balance : "0"}`}
        </div>
      </div>
      <Component.render
        route={route} setRoute={setRoute}
        userData={userData} setUserData={setGlobalUserData}
        walletData={walletData} setWalletData={setWalletData}
      />
      <ToastContainer />
    </>
  );
}

export default App;
