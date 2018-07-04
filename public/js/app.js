const BigNumber = require("bignumber.js");

const batchTransferWalletAbi =  [{"constant":true,"inputs":[{"name":"_token","type":"address"}],"name":"allowanceForContract","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"},{"name":"_receivers","type":"address[]"},{"name":"_tokenAmounts","type":"uint256[]"}],"name":"batchTransferToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"}],"name":"balanceOfContract","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_receivers","type":"address[]"},{"name":"_amounts","type":"uint256[]"}],"name":"batchTransferEther","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_receiver","type":"address"},{"name":"_token","type":"address"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"receiver","type":"address"},{"indexed":true,"name":"token","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":true,"name":"receiver","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"TransferEther","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}];
const tokenABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];

App = {
    batchTransferWalletContract: {
        address: null
    },
    tokenContract: {
        instance: null,
        symbol: null,
        decimals: null
    },
    userAccount: null,
    csvFile: {
        instance: null,
        addresses: null,
        amounts: null,
    },

    init: () => {
        return App.initWeb3();
    },

    initWeb3: () => {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:9545');
        }
        web3 = new Web3(App.web3Provider);
        App.userAccount = web3.eth.accounts[0];
        return App.initContract();
    },

    initContract: () => {
        web3.version.getNetwork((err, netId) => {
            switch (netId) {
                case "1":
                    App.batchTransferWalletContract.address = "0x6e82AaBffe24f275Ad3f703ACA922DD4d8f86168";
                    break;
                case "4":
                    App.batchTransferWalletContract.address = "0xc48f1e682be2009af01a0a08a7f5149f9492d57b";
                    break;
                default:
                    createErrorElement("You cannot use this network. Please use mainnet or rinkeby netowork.");
            }
        });

        App.bindEvents();
    },

    bindEvents: () => {
        $(document).on('click', '#csv-import-token-btn', App.csvImportForToken);
        $(document).on('click', '#csv-import-ether-btn', App.csvImportForEther);
        $(document).on('click', '#balance-btn', App.balance);
        $(document).on('click', '#approve-btn', App.approve);
        $(document).on('click', '#send-btn', App.transfer);
        $(document).on('change',"#importForm input[name='csv']", App.fileUpload);
    },

    csvImportForToken : async () => {
        clearElement();
        const tokenContractAddress = $("#importForm input[name='contract-address']")[0].value;

        // error check
        if (!App.csvFile.instance) {
            createErrorElement("csv file is invalid.");
            return;
        } else if (!isAddress(tokenContractAddress)) {
            createErrorElement(`contract address "${tokenContractAddress}" is not ethereum address`);
            return;
        }

        // reflesh token infomation
        App.tokenContract.instance = web3.eth.contract(tokenABI).at(tokenContractAddress);
        await setSymbolAndDecimals();
        await refleshBalanceAndAllowance();

        // csv format is "address,amount"
        App.csvFile.addresses = App.csvFile.instance.split("\n").map(function (value) {
            return value.split(",")[0]
        });
        App.csvFile.amounts = App.csvFile.instance.split("\n").map(function (value) {
            return value.split(",")[1];
        });

        $("#table-send").append($("<table class='ui celled table' id='table'>"));

        // thead
        const nesting = $("<tr>").append("<th class='center aligned'>#</th>","<th>Address</th>","<th>Amount</th>");
        $("#table").append($("<thead/>").append(nesting));

        let totalAmount = new BigNumber(0);
        let validAllData = true;

        if (App.csvFile.addresses.length > 100) {
            createErrorElement("Please set less than or equal to 100 address.");
            return;
        }

        // tbody
        for(let i = 0; App.csvFile.addresses.length > i; i++) {

            $("#table").append($(`<tr id='table-tr${i}'></div>`).append(`<td class='center aligned'>${i+1}</td>`));

            if (!isAddress(App.csvFile.addresses[i])) {
                $(`#table-tr${i}`).append(`<td class="negative">${App.csvFile.addresses[i]}</td>`);
                validAllData = false;
            } else {
                $(`#table-tr${i}`).append(`<td>${App.csvFile.addresses[i]}</td>`);
            }

            if (!isFinite(App.csvFile.amounts[i]) || App.csvFile.amounts[i] <= 0 || invalidDecimals(App.csvFile.amounts[i])) {
                $(`#table-tr${i}`).append(`<td class="negative">${App.csvFile.amounts[i]}</td>`);
                validAllData = false;
            } else {
                $(`#table-tr${i}`).append(`<td>${new BigNumber(App.csvFile.amounts[i])} ${App.tokenContract.symbol}</td>`);
                totalAmount = totalAmount.plus(App.csvFile.amounts[i]);
            }
        }

        if (!validAllData) {
            createErrorElement("There are more than one invalid address or amount. Please check data in red background.");
        } else {
            $("#send").append($('<div class="ui button" id="send-btn" name="submit" style="margin-top:10px;">Send</div>'));
        }

        refleshTotalAmount(totalAmount);

        $("#importForm input[name='csv']").val('');
    },

    csvImportForEther : async () => {
        clearElement();

        // error check
        if (!App.csvFile.instance) {
            createErrorElement("csv file is invalid.");
            return;
        }

        // csv format is "address,amount"
        App.csvFile.addresses = App.csvFile.instance.split("\n").map(function (value) {
            return value.split(",")[0]
        });
        App.csvFile.amounts = App.csvFile.instance.split("\n").map(function (value) {
            return value.split(",")[1];
        });

        $("#table-send").append($("<table class='ui celled table' id='table'>"));

        // thead
        const nesting = $("<tr>").append("<th class='center aligned'>#</th>","<th>Address</th>","<th>Amount</th>");
        $("#table").append($("<thead/>").append(nesting));

        let totalAmount = new BigNumber(0);
        let validAllData = true;

        if (App.csvFile.addresses.length > 100) {
            createErrorElement("Please set less than or equal to 100 address.");
            return;
        }

        // tbody
        for(let i = 0; App.csvFile.addresses.length > i; i++) {

            $("#table").append($(`<tr id='table-tr${i}'></div>`).append(`<td class='center aligned'>${i+1}</td>`));

            if (!isAddress(App.csvFile.addresses[i])) {
                $(`#table-tr${i}`).append(`<td class="negative">${App.csvFile.addresses[i]}</td>`);
                validAllData = false;
            } else {
                $(`#table-tr${i}`).append(`<td>${App.csvFile.addresses[i]}</td>`);
            }

            if (!isFinite(App.csvFile.amounts[i]) || App.csvFile.amounts[i] <= 0 || invalidDecimalsForEther(App.csvFile.amounts[i])) {
                $(`#table-tr${i}`).append(`<td class="negative">${App.csvFile.amounts[i]}</td>`);
                validAllData = false;
            } else {
                $(`#table-tr${i}`).append(`<td>${new BigNumber(App.csvFile.amounts[i])} ETH</td>`);
                totalAmount = totalAmount.plus(App.csvFile.amounts[i]);
            }
        }

        if (!validAllData) {
            createErrorElement("There are more than one invalid address or amount. Please check data in red background.");
        } else {
            $("#send").append($('<div class="ui button" id="send-btn" name="submit" style="margin-top:10px;">Send</div>'));
        }

        refleshTotalAmountForEther(totalAmount);

        $("#importForm input[name='csv']").val('');
    },

    transfer : async () => {
        clearStatusAndError();

        const approveBalance = new BigNumber($("#approvedBalance").val()) * (10 ** App.tokenContract.decimals);
        const totalAmount = new BigNumber($("#totalAmount").val()) * (10 ** App.tokenContract.decimals);
        const holdingBalance = new BigNumber($("#holdingBalance").val()) * (10 ** App.tokenContract.decimals);

        if (totalAmount > approveBalance) {
            createErrorElement("totalAmount is larger than approveBalance.");
            return;
        } else if (totalAmount > holdingBalance) {
            createErrorElement("totalAmount is larger than holdingBalance.");
            return;
        }

        const batchTransferWalletContractInstance = web3.eth.contract(batchTransferWalletAbi).at(App.batchTransferWalletContract.address);
        const amounts = createTransferAmounts(App.csvFile.amounts);
        const asyncBatchTransfer = promisify(cb => batchTransferWalletContractInstance.batchTransferToken(App.tokenContract.instance.address, App.csvFile.addresses, amounts, cb));

        try {
            const txHash = await asyncBatchTransfer;
            createTransactionStatus(txHash);
        } catch(error) {
            createErrorElement(error);
        }
    },

    balance : async () => {
        clearStatusAndError();

        const tokenContractAddress = $("#balanceForm input[name='contract-address']")[0].value;

        if (!isAddress(tokenContractAddress)) {
            createErrorElement(`contract address "${tokenContractAddress}" is not ethereum address`);
            return;
        }

        App.tokenContract.instance = web3.eth.contract(tokenABI).at(tokenContractAddress);

        await setSymbolAndDecimals();
        await refleshBalanceAndAllowance();

        $("#approveForm").empty();
        $("#approveForm").append(`
            <form class="ui form">
                <div class="field">
                    <label>Approve token</label>
                    <input name="approve-token-amount" type="number" min="0">
                </div>
                <div class="ui button" id="approve-btn" name="submit" style="margin-top:10px;">Submit</div>
            </form>
        `);
    },

    approve : async () => {
        clearStatusAndError();

        const tokenAmountString = $("#approveForm input[name='approve-token-amount']")[0].value;
        if (!checkTokenAmount(tokenAmountString)) {
            createErrorElement("You can't input the number less than 0");
            return;
        }

        if (invalidDecimals(tokenAmountString)) {
            createErrorElement("You can't use the decimals longer than the one defined in token contract");
            return;
        }

        const decimalValue = 10 ** App.tokenContract.decimals;
        const tokenAmountBigNumber = new BigNumber(tokenAmountString);
        const calcTokenAmount = tokenAmountBigNumber.mul(decimalValue);

        const asyncApprove = promisify(cb => App.tokenContract.instance.approve(App.batchTransferWalletContract.address, calcTokenAmount.toNumber(), {from:App.userAccount}, cb));

        try {
            const txHash = await asyncApprove;
            createTransactionStatus(txHash);
        } catch(error) {
            createErrorElement(error);
        }
    },

    fileUpload : (e) => {
        let file = e.target.files[0];
        var reader = new FileReader();

        reader.readAsText(file);
        reader.addEventListener('load', function() {
            console.log(reader.result);
            App.csvFile.instance = reader.result;
        })
    }
};

const promisify = (inner) =>
    new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    );

const createTransactionStatus = (txHash) => {
    $("#txStatus").append(`
        <div class="ui positive message">
            <i class="close icon"></i>
            <div class="header">
                Transaction ${txHash} was created
            </div>
            <p>Please wait for this transaction to be mined.</p>
        </div>`
    )
}

const clearElement = () => {
    clearStatusAndError();
    $("#table-send").empty();
    $("#send").empty();
}

const clearStatusAndError = () => {
    $("#txStatus").empty();
    $("#error").empty();
}

const createTransferAmounts = (amounts) => {
    let returnAmounts = [];
    for (let i = 0; i < amounts.length; i++) {
        returnAmounts[i] = new BigNumber(amounts[i]).mul(10 ** App.tokenContract.decimals);
    }
    return returnAmounts;
}

const invalidDecimals = (tokenAmount) => {
    const length = (tokenAmount + '.').match(/\.\d*/)[0].length - 1;
    return length > App.tokenContract.decimals;
}

const invalidDecimalsForEther = (tokenAmount) => {
    const length = (tokenAmount + '.').match(/\.\d*/)[0].length - 1;
    return length > 18;
}

const setSymbolAndDecimals = async () => {
    const asyncSymbol = promisify(cb => App.tokenContract.instance.symbol.call(cb));
    const asyncDecimals = promisify(cb => App.tokenContract.instance.decimals.call(cb));

    App.tokenContract.decimals = await asyncDecimals;
    App.tokenContract.symbol = await asyncSymbol;
}

const refleshTotalAmount = (amount) => {
    $("#totalAmount").empty();
    // To be used for checking before transfer
    $("#totalAmount").val(amount);
    $("#totalAmount").append(addReadOnlyField("Total amount of sending token", `${amount} ${App.tokenContract.symbol}`));
}

const refleshTotalAmountForEther = (amount) => {
    $("#totalAmount").empty();
    // To be used for checking before transfer
    $("#totalAmount").val(amount);
    $("#totalAmount").append(addReadOnlyField("Total amount of sending token", `${amount} ETH`));
}

const refleshBalanceAndAllowance = async () => {
    const asyncAllowance = promisify(cb => App.tokenContract.instance.allowance.call(App.userAccount, App.batchTransferWalletContract.address, cb))
    const allowance = new BigNumber(await asyncAllowance);
    $("#approvedBalance").empty();
    // To be used for checking before transfer
    $("#approvedBalance").val(allowance.div(10 ** App.tokenContract.decimals));
    $("#approvedBalance").append(addReadOnlyField("Your approval balance", `${allowance.div(10 ** App.tokenContract.decimals)} ${App.tokenContract.symbol}`));

    const asyncBalanceOf = promisify(cb => App.tokenContract.instance.balanceOf.call(App.userAccount, cb));
    const balanceOfUser = new BigNumber(await asyncBalanceOf);
    $("#holdingBalance").empty();
    // To be used for checking before transfer
    $("#holdingBalance").val(balanceOfUser.div(10 ** App.tokenContract.decimals));
    $("#holdingBalance").append(addReadOnlyField("Your balance", `${balanceOfUser.div(10 ** App.tokenContract.decimals)} ${App.tokenContract.symbol}`));
}

const addReadOnlyField = (labelString, placeholderString) => {
    return `<div class="ui form">
                <div class="field">
                    <label>${labelString}</label>
                    <input placeholder="${placeholderString}" readonly="" type="text" kl_vkbd_parsed="true">
                </div>
            </div>`;
}

const createErrorElement = (outputMsg) => {
    $("#error").append(`
        <div class="ui negative message">
            <i class="close icon"></i>
            <div class="header">
                Error Message
            </div>
            <p>${outputMsg}</p>
        </div>
    `);
}

const checkTokenAmount = (value) => {
    const pettern = /^([1-9]\d*|0)(\.\d+)?$/;
    return pettern.test(value);
}

const isAddress = (address) => {
    const lowerAddress = address.toLowerCase();
    if (/^(0x)?[0-9a-f]{40}$/i.test(lowerAddress)) {
        return true;
    } else {
        return false;
    }
};

$( () => {
    $(window).load(function () {
        App.init();
    });
});