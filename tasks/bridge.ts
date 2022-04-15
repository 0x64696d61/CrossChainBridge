import {task} from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import {ethers} from "hardhat";
import {BytesLike} from "@ethersproject/bytes"

const contract_name = 'Bridge'
const prefix = contract_name + '_'

task(prefix + "swap", "Transfer token to another chain")
    .addParam("address", "Contract address")
    .addParam("amount", "amount")
    .addParam("toAddress", "to address")
    .setAction(async (taskArgs, hre) => {
        const [acc1] = await hre.ethers.getSigners()
        const factory = await hre.ethers.getContractFactory(contract_name);
        const contract = await factory.attach(taskArgs.address)
        await contract.connect(acc1).swap(taskArgs.amount, taskArgs.toAddress)
    });
// function redeem(uint seq, address sender, address toAddress, uint amount, uint8 fromChainId, uint8 toChainId, bytes memory signature) external
task(prefix + "redeem", "get swapped token")
    .addParam("address", "contract address")
    .addParam("seq", "sequence")
    .addParam("sender", "fromAddress")
    .addParam("toAddress", "toAddress")
    .addParam("amount", "amount")
    .addParam("fromChainId", "fromChainId")
    .addParam("toChainId", "toChainId")
    .setAction(async (taskArgs, hre) => {
        const [acc1] = await hre.ethers.getSigners()
        const factory = await hre.ethers.getContractFactory(contract_name);
        const contract = await factory.attach(taskArgs.address)

        let wallet = new hre.ethers.Wallet(<BytesLike>process.env.BRIDGE_PRIVATE_KEY)
        let message = hre.ethers.utils.arrayify(hre.ethers.utils.solidityKeccak256(
            ["uint", "address", "address", "uint", "uint8", "uint8"],
            [taskArgs.seq, taskArgs.sender, taskArgs.toAddress, taskArgs.amount, taskArgs.fromChainId, taskArgs.toChainId]
        ));

        await contract.connect(acc1).redeem(
            taskArgs.seq,
            taskArgs.sender,
            taskArgs.toAddress,
            taskArgs.amount,
            taskArgs.fromChainId,
            taskArgs.toChainId,
            wallet.signMessage(message)
        )
    });
