import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("CooperativeContribution", function () {
  this.timeout(120000);

  let externalContract: Contract;
  let contributionContract: Contract;

  describe("Contribution", function () {
    if (process.env.CONTRACT_ADDRESS) {
      it("Should connect to external contract", async function () {
        contributionContract = await ethers.getContractAt("CooperativeContribution", process.env.CONTRACT_ADDRESS!);
        console.log("     🛰 Connected to external contract", contributionContract.address);
      });
    } else {
      it("Should deploy ExternalContract", async function () {
        const ExternalContract = await ethers.getContractFactory("ExternalContract");
        externalContract = await ExternalContract.deploy();
      });
      // it("Should deploy Contrubution", async function () {
      //   const Contribution = await ethers.getContractFactory("CooperativeContribution");
      //   contributionContract = await Contribution.deploy(externalContract.address);
      // });
    }
  });
});
