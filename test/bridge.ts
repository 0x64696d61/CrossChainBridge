import {expect} from "chai";
import {ethers, network} from "hardhat";

const contractName = "Bridge"

describe(contractName, function () {
    let acc1: any
    let acc2: any
    let contractBridge: any
    let contractUsdc: any
    // Chains IDs:
    // Rinkeby 4,
    // Binance Smart Chain Testnet 97
    const eth = 4
    const bsc = 97
    const amount = 13
    const backendAddress = '0x14791697260E4c9A71f18484C9f997B308e59325'

    function getFlatSign(seq: any) {
        let privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123'
        let wallet = new ethers.Wallet(privateKey)
        let message  = ethers.utils.arrayify( ethers.utils.solidityKeccak256(
            ["uint", "address", "address", "uint", "uint8", "uint8"],
            [seq, acc1.address, acc2.address, amount, eth, bsc]
        ));

        return wallet.signMessage(message);
    }

    beforeEach(async function () {

        [acc1, acc2] = await ethers.getSigners()

        let factory = await ethers.getContractFactory("myUSDC", acc1)
        contractUsdc = await factory.deploy();

        factory = await ethers.getContractFactory(contractName, acc1)
        contractBridge = await factory.deploy(contractUsdc.address, backendAddress, eth, bsc);

        contractUsdc.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), contractBridge.address)
        await contractUsdc.approve(contractBridge.address, amount)
    })

    it("Should be deployed", async function () {
        expect(contractBridge.address).to.be.properAddress
    })

    describe("swap method", function () {
        it("Tokens should be burn from the sender", async function () {
            let balance = await contractUsdc.balanceOf(acc1.address)
            await contractBridge.swap(amount, acc2.address)

            expect(await contractUsdc.balanceOf(acc1.address)).to.be.equal(balance - amount)

        })
        it("TotalSupply will be changed", async function () {
            let totalSupply = await contractUsdc.totalSupply()
            await contractBridge.swap(amount, acc2.address)

            expect(await contractUsdc.totalSupply()).to.be.equal(totalSupply.sub(amount))
        })

        it("Should be Event about swap", async function () {
            await expect(contractBridge.swap(amount, acc2.address)).to.be.to.emit(contractBridge, "swapInitialized").withArgs(acc1.address, acc2.address, amount, eth, bsc)
        })
    })
    describe("redeem method", function () {
        it("If signature is success tokens should be minted to sender", async function () {
            let balance = await contractUsdc.balanceOf(acc2.address)
            await contractBridge.redeem(1, acc1.address, acc2.address, amount, eth, bsc, getFlatSign(1))

            expect(await contractUsdc.balanceOf(acc2.address)).to.be.equal(balance + amount)
        })
        it("If signature is success totalSupply will be changed", async function () {
            let totalSupply = await contractUsdc.totalSupply()
            await contractBridge.redeem(1, acc1.address, acc2.address, amount, eth, bsc, getFlatSign(1))

            expect(await contractUsdc.totalSupply()).to.be.equal(totalSupply.add(amount))
        })
        it("Should be reverted if user try mint twice", async function () {
            await contractBridge.redeem(1, acc1.address, acc2.address, amount, eth, bsc, getFlatSign(1))

            await expect(contractBridge.redeem(1, acc1.address, acc2.address, amount, eth, bsc, getFlatSign(1))).to.be.revertedWith("This swap already done")
        })
        it("Should be reverted if bad signature", async function () {
            await expect(contractBridge.redeem(1, acc1.address, acc2.address, amount, eth, bsc, getFlatSign(2))).to.be.revertedWith("The signed is broken")
        })
    })

});
