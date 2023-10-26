import { ethers, network } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("Contribution Contract", function () {
  this.timeout(120000);

  let externalContract: Contract;
  let contributionContract: Contract;

  describe("CooperativeContribution", function () {
    if (process.env.CONTRACT_ADDRESS) {
      it("Should connect to external contract", async function () {
        contributionContract = await ethers.getContractAt("CooperativeContribution", process.env.CONTRACT_ADDRESS!);
        console.log("     🛰 Connected to external contract", contributionContract.address);
      });
    } else {
      it("Should deploy externalContract", async function () {
        const ExternalContract = await ethers.getContractFactory("ExternalContract");
        externalContract = await ExternalContract.deploy();
      });
      it("Should deploy CooperativeContribution", async function () {
        const Staker = await ethers.getContractFactory("Staker");
        contributionContract = await Staker.deploy(externalContract.address);
      });
    }

    describe("makeContribution()", function () {
      if (process.env.CONTRACT_ADDRESS) {
        console.log(
          " 🤷 since we will run this test on a live contract this is as far as the automated tests will go...",
        );
      } else {
        it("If enough is staked and time has passed, you should be able to complete", async function () {
          const timeLeft1 = await contributionContract.timeLeft();
          console.log("\t", "⏱ There should be some time left: ", timeLeft1.toNumber());
          expect(timeLeft1.toNumber()).to.greaterThan(0);

          console.log("\t", " 🚀 Staking a full eth!");
          const stakeResult = await contributionContract.contribute({ value: ethers.utils.parseEther("1") });
          console.log("\t", " 🏷  contributionResult: ", stakeResult.hash);

          console.log("\t", " ⌛️ fast forward time...");
          await network.provider.send("evm_increaseTime", [3600]);
          await network.provider.send("evm_mine");

          const timeLeft2 = await contributionContract.timeLeft();
          console.log("\t", "⏱ Time should be up now: ", timeLeft2.toNumber());
          expect(timeLeft2.toNumber()).to.equal(0);

          console.log("\t", " 🎉 calling execute");
          const execResult = await contributionContract.execute();
          console.log("\t", " 🏷  execResult: ", execResult.hash);

          const result = await externalContract.completed();
          console.log("\t", " 🥁 complete: ", result);
          expect(result).to.equal(true);
        });

        it("Should redeploy Contribution, deposit, not get enough, and withdraw", async function () {
          const [secondAccount] = await ethers.getSigners();

          const ExternalContract = await ethers.getContractFactory("ExternalContract");
          externalContract = await ExternalContract.deploy();

          const Staker = await ethers.getContractFactory("Staker");
          contributionContract = await Staker.deploy(externalContract.address);

          console.log("\t", " 🔨 Staking...");
          const stakeResult = await contributionContract
            .connect(secondAccount)
            .stake({ value: ethers.utils.parseEther("0.001") });
          console.log("\t", " 🏷  stakeResult: ", stakeResult.hash);

          console.log("\t", " ⏳ Waiting for confirmation...");
          const txResult = await stakeResult.wait();
          expect(txResult.status).to.equal(1);

          console.log("\t", " ⌛️ fast forward time...");
          await network.provider.send("evm_increaseTime", [3600]);
          await network.provider.send("evm_mine");

          console.log("\t", " 🎉 calling execute");
          const execResult = await contributionContract.execute();
          console.log("\t", " 🏷  execResult: ", execResult.hash);

          const result = await externalContract.completed();
          console.log("\t", " 🥁 complete should be false: ", result);
          expect(result).to.equal(false);

          const startingBalance = await ethers.provider.getBalance(secondAccount.address);
          //console.log("startingBalance before withdraw", ethers.utils.formatEther(startingBalance))

          console.log("\t", " 💵 calling withdraw");
          const withdrawResult = await contributionContract.connect(secondAccount).withdraw();
          console.log("\t", " 🏷  withdrawResult: ", withdrawResult.hash);

          // need to account for the gas cost from calling withdraw
          const tx = await ethers.provider.getTransaction(withdrawResult.hash);
          const receipt = await ethers.provider.getTransactionReceipt(withdrawResult.hash);
          const gasCost = tx.gasPrice?.mul(receipt.gasUsed);

          const endingBalance = await ethers.provider.getBalance(secondAccount.address);
          //console.log("endingBalance after withdraw", ethers.utils.formatEther(endingBalance))

          expect(endingBalance).to.equal(
            startingBalance.add(ethers.utils.parseEther("0.001")).sub(ethers.BigNumber.from(gasCost)),
          );
        });
      }
    });
  });
});
