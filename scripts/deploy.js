const hre = require("hardhat");

async function main() {
  // DeviceAuth 컨트랙트 팩토리를 가져옵니다.
  const DeviceAuth = await hre.ethers.getContractFactory("DeviceAuth");
  
  // 컨트랙트 배포를 시작합니다.
  const deviceAuth = await DeviceAuth.deploy();

  // 배포가 완료될 때까지 기다립니다.
  await deviceAuth.waitForDeployment();

  // 배포된 컨트랙트의 주소를 출력합니다. (나중에 프론트엔드에 입력해야 함)
  const address = await deviceAuth.getAddress();
  console.log("DeviceAuth 컨트랙트 배포 완료! 주소:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});