import sdkMock from './sdk-mock'

const userMock = {
    isLogged: false,
    isLoading: false,
    isBurner: false,
    isWeb3Capable: false,
    account: '',
    web3: {},
    ...sdkMock,
    balance: { eth: 0, nevermined: 0 },
    network: '',
    requestFromFaucet: jest.fn(),
    loginMetamask: jest.fn(),
    loginBurnerWallet: jest.fn(),
    message: ''
}

const userMockConnected = {
    isLogged: true,
    isLoading: false,
    isBurner: false,
    isWeb3Capable: true,
    account: '0xxxxxx',
    web3: {},
    ...sdkMock,
    balance: { eth: 0, nevermined: 0 },
    network: '',
    requestFromFaucet: jest.fn(),
    loginMetamask: jest.fn(),
    loginBurnerWallet: jest.fn(),
    message: '',
    tokenSymbol:'NVM'
}

export { userMock, userMockConnected }
