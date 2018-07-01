const env = process.env.NODE_ENV;

const config = {
    testnet: {
        batchTransfer: "0xc48f1e682be2009af01a0a08a7f5149f9492d57b"
    },
    production: {
        batchTransfer: "0x6e82AaBffe24f275Ad3f703ACA922DD4d8f86168"
    }
}

module.exports = config[env];