import {ethers} from "hardhat";

const contract_name = 'Bridge'
const usdcToken = '0x58c391bfCf7C7aEf634052F4A41a79488Fe6A51F'
const backendAddress = '0x7620B8FC45f0F445471Aa9534C3836d290CC6d93'
const fromChainId = 4
const toChainId = 97

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const factory = await ethers.getContractFactory(contract_name);
    const contract = await factory.deploy(usdcToken, backendAddress, fromChainId, toChainId);
    await contract.deployed();

    console.log("Contract deployed to:", contract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });