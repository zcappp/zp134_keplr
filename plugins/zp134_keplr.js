import { StargateClient, SigningStargateClient } from "@cosmjs/stargate"

const RpcUrl = "https://rpc.sentry-01.theta-testnet.polypore.xyz"

async function init(ref) {
    ref.client = await StargateClient.connect(RpcUrl)
    // const chainId = await ref.client.getChainId()
    // log("chainID", chainId)
    window.connectKeplr = async () => {
        if (!window.keplr) return alert("You need to install Keplr")
        try {
            await window.keplr.experimentalSuggestChain(TestnetChainInfo)
            log('Wallet connected!')
        } catch (err) {
            warn(err.message || err)
        }
        const offlineSigner = window.keplr.getOfflineSigner("theta-testnet-001")
        const signingClient = await SigningStargateClient.connectWithSigner("https://rpc.sentry-01.theta-testnet.polypore.xyz", offlineSigner)
        const account = (await offlineSigner.getAccounts())[0]
        return { address: account.address, balance: (await signingClient.getBalance(account.address, "uatom")).amount }
    }

    window.sendKeplr = async (myAddress, toAmount, toAddress, denom) => {
        const offlineSigner = window.keplr.getOfflineSigner("theta-testnet-001")
        const signingClient = await SigningStargateClient.connectWithSigner(RpcUrl, offlineSigner)
        const account = (await offlineSigner.getAccounts())[0]
        const sendResult = await signingClient.sendTokens(
            account.address,
            toAddress,
            [{
                denom: denom,
                amount: toAmount,
            }], {
                amount: [{ denom: "uatom", amount: "500" }],
                gas: "200000",
            }
        )
        const myBalance = await signingClient.getBalance(account.address, denom)
        log(sendResult, myBalance)
        return myBalance.amount
    }
}

const TestnetChainInfo = {
    chainId: "theta-testnet-001",
    chainName: "theta-testnet-001",
    rpc: "https://rpc.sentry-01.theta-testnet.polypore.xyz/",
    rest: "https://rest.sentry-01.theta-testnet.polypore.xyz/",
    bip44: {
        coinType: 118,
    },
    bech32Config: {
        bech32PrefixAccAddr: "cosmos",
        bech32PrefixAccPub: "cosmos" + "pub",
        bech32PrefixValAddr: "cosmos" + "valoper",
        bech32PrefixValPub: "cosmos" + "valoperpub",
        bech32PrefixConsAddr: "cosmos" + "valcons",
        bech32PrefixConsPub: "cosmos" + "valconspub",
    },
    currencies: [{
            coinDenom: "ATOM",
            coinMinimalDenom: "uatom",
            coinDecimals: 6,
            coinGeckoId: "cosmos",
        },
        {
            coinDenom: "THETA",
            coinMinimalDenom: "theta",
            coinDecimals: 0,
        },
        {
            coinDenom: "LAMBDA",
            coinMinimalDenom: "lambda",
            coinDecimals: 0,
        },
        {
            coinDenom: "RHO",
            coinMinimalDenom: "rho",
            coinDecimals: 0,
        },
        {
            coinDenom: "EPSILON",
            coinMinimalDenom: "epsilon",
            coinDecimals: 0,
        },
    ],
    feeCurrencies: [{
        coinDenom: "ATOM",
        coinMinimalDenom: "uatom",
        coinDecimals: 6,
        coinGeckoId: "cosmos",
    }],
    stakeCurrency: {
        coinDenom: "ATOM",
        coinMinimalDenom: "uatom",
        coinDecimals: 6,
        coinGeckoId: "cosmos",
    },
    coinType: 118,
    gasPriceStep: {
        low: 1,
        average: 1,
        high: 1,
    },
    features: ["ibc-transfer"],
}

$plugin({
    id: "zp134",
    props: [],
    init
})