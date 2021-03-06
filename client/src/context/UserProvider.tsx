import React, { PureComponent } from 'react'
import Web3 from 'web3'
import { Nevermined, Account } from '@nevermined-io/nevermined-sdk-js'
import { User } from '.'
import { provideNevermined, requestFromFaucet, FaucetResponse } from '../nevermined'
import { nodeUri } from '../config'
import MarketProvider from './MarketProvider'
import { MetamaskProvider } from './MetamaskProvider'
import { BurnerWalletProvider } from './BurnerWalletProvider'

const POLL_ACCOUNTS = 1000 // every 1s
const POLL_NETWORK = POLL_ACCOUNTS * 60 // every 1 min
const DEFAULT_WEB3 = new Web3(new Web3.providers.HttpProvider(nodeUri)) // default web3

interface UserProviderState {
    isLogged: boolean
    isBurner: boolean
    isWeb3Capable: boolean
    isLoading: boolean
    account: string
    balance: {
        eth: number
        nevermined: number
    }
    network: string
    web3: Web3
    sdk: Nevermined
    requestFromFaucet(account: string): Promise<FaucetResponse>
    loginMetamask(): Promise<any>
    loginBurnerWallet(): Promise<any>
    logoutBurnerWallet(): Promise<any>
    message: string
    tokenSymbol: string
}

export default class UserProvider extends PureComponent<{}, UserProviderState> {
    private loginMetamask = async () => {
        const metamaskProvider = new MetamaskProvider()
        await metamaskProvider.startLogin()
        const web3 = metamaskProvider.getProvider()
        this.setState(
            {
                isLogged: true,
                isBurner: false,
                web3
            },
            () => {
                this.loadNevermined()
            }
        )
    }

    private loginBurnerWallet = async () => {
        const burnerwalletProvider = new BurnerWalletProvider()
        await burnerwalletProvider.startLogin()
        const web3 = burnerwalletProvider.getProvider()
        this.setState(
            {
                isLogged: true,
                isBurner: true,
                web3
            },
            () => {
                this.loadNevermined()
            }
        )
    }

    private logoutBurnerWallet = async () => {
        const burnerwalletProvider = new BurnerWalletProvider()
        await burnerwalletProvider.logout()
    }

    public state = {
        isLogged: false,
        isBurner: false,
        isWeb3Capable: Boolean(window.web3 || window.ethereum),
        isLoading: true,
        balance: {
            eth: 0,
            nevermined: 0
        },
        network: '',
        web3: DEFAULT_WEB3,
        account: '',
        sdk: {} as any,
        requestFromFaucet: () => requestFromFaucet(''),
        loginMetamask: () => this.loginMetamask(),
        loginBurnerWallet: () => this.loginBurnerWallet(),
        logoutBurnerWallet: () => this.logoutBurnerWallet(),
        message: 'Connecting to Nevermined...',
        tokenSymbol: '',
    }

    private accountsInterval: any = null

    private networkInterval: any = null

    public async componentDidMount() {
        await this.bootstrap()
    }

    private initAccountsPoll() {
        if (!this.accountsInterval) {
            this.accountsInterval = setInterval(
                this.fetchAccounts,
                POLL_ACCOUNTS
            )
        }
    }

    private initNetworkPoll() {
        if (!this.networkInterval) {
            this.networkInterval = setInterval(this.fetchNetwork, POLL_NETWORK)
        }
    }

    private loadDefaultWeb3 = async () => {
        this.setState(
            {
                isLogged: false,
                isBurner: false,
                web3: DEFAULT_WEB3
            },
            () => {
                this.loadNevermined()
            }
        )
    }

    private fetchTokenSymbol = async () => {
        const { sdk } = this.state
        let tokenSymbol = 'Unknown'
        if (sdk.keeper) {
            tokenSymbol = await sdk.token.getSymbol()
        }
        tokenSymbol !== this.state.tokenSymbol && this.setState({ tokenSymbol })
    }

    private loadNevermined = async () => {
        const { sdk } = await provideNevermined(this.state.web3)
        this.setState({ sdk, isLoading: false }, () => {
            this.initNetworkPoll()
            this.initAccountsPoll()
            this.fetchNetwork()
            this.fetchAccounts()
            this.fetchTokenSymbol()
        })
    }

    private bootstrap = async () => {
        const logType = localStorage.getItem('logType')
        const metamaskProvider = new MetamaskProvider()

        switch (logType) {
            case 'Metamask':
                if (
                    (await metamaskProvider.isAvailable()) &&
                    (await metamaskProvider.isLogged())
                ) {
                    const web3 = metamaskProvider.getProvider()
                    this.setState(
                        {
                            isLogged: true,
                            web3
                        },
                        () => {
                            this.loadNevermined()
                        }
                    )
                } else {
                    this.loadDefaultWeb3()
                }
                break
            case 'BurnerWallet':
                this.loginBurnerWallet()
                break
            default:
                this.loginBurnerWallet()
                break
        }
    }

    private fetchAccounts = async () => {
        const { sdk, isLogged } = this.state

        if (isLogged) {
            let accounts

            // Modern dapp browsers
            if (window.ethereum && !isLogged) {
                // simply set to empty, and have user click a button somewhere
                // to initiate account unlocking
                accounts = []

                // alternatively, automatically prompt for account unlocking
                // await this.unlockAccounts()
            }

            accounts = await sdk.accounts.list()

            if (accounts.length > 0) {
                const account = await accounts[0].getId()

                if (account !== this.state.account) {
                    this.setState({
                        account,
                        isLogged: true,
                        requestFromFaucet: () => requestFromFaucet(account)
                    })

                    await this.fetchBalance(accounts[0])
                }
            } else {
                !isLogged && this.setState({ isLogged: false, account: '' })
            }
        }
    }

    private fetchBalance = async (account: Account) => {
        const balance = await account.getBalance()
        const { eth, nevermined } = balance
        if (eth !== this.state.balance.eth || nevermined !== this.state.balance.nevermined) {
            this.setState({ balance: { eth, nevermined } })
        }
    }

    private fetchNetwork = async () => {
        const { sdk } = this.state
        let network = 'Unknown'
        if (sdk.keeper) {
            network = await sdk.keeper.getNetworkName()
        }
        network !== this.state.network && this.setState({ network })
    }

    public render() {
        return (
            <User.Provider value={this.state}>
                <MarketProvider nevermined={this.state.sdk}>
                    {this.props.children}
                </MarketProvider>
            </User.Provider>
        )
    }
}
