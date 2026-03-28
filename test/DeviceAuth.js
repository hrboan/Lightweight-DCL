const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeviceAuth Contract", function () {
  let DeviceAuth;
  let deviceAuth;
  let owner;
  let addr1;

  const deviceId = "temp-001";

  // 각 테스트가 실행되기 전에 매번 컨트랙트를 새로 배포하여 초기 상태를 만듭니다.
  beforeEach(async function () {
    DeviceAuth = await ethers.getContractFactory("DeviceAuth");
    [owner, addr1] = await ethers.getSigners(); // 테스트용 가상 지갑 계정들
    deviceAuth = await DeviceAuth.deploy();
  });

  describe("1. Registration (기기 등록)", function () {
    it("새로운 기기를 정상적으로 등록해야 한다", async function () {
      await deviceAuth.registerDevice(deviceId);
      const device = await deviceAuth.devices(deviceId);
      
      expect(device.isRegistered).to.equal(true);
      expect(device.isActive).to.equal(true);
      expect(device.owner).to.equal(owner.address);
    });

    it("이미 등록된 기기는 중복 등록할 수 없다", async function () {
      await deviceAuth.registerDevice(deviceId);
      await expect(deviceAuth.registerDevice(deviceId)).to.be.revertedWith("Device is already registered.");
    });
  });

  describe("2. Authentication (실시간 인증)", function () {
    it("등록되고 활성화된 기기는 인증에 통과(true)해야 한다", async function () {
      await deviceAuth.registerDevice(deviceId);
      const isAuthenticated = await deviceAuth.authenticateDevice(deviceId);
      expect(isAuthenticated).to.equal(true);
    });

    it("등록되지 않은 기기는 인증에 실패(false)해야 한다", async function () {
      const isAuthenticated = await deviceAuth.authenticateDevice(deviceId);
      expect(isAuthenticated).to.equal(false);
    });
  });

  describe("3. Management (상태 및 권한 관리)", function () {
    it("소유자는 기기의 상태(isActive)를 변경하여 인증을 차단할 수 있다", async function () {
      await deviceAuth.registerDevice(deviceId);
      
      // 기기 상태를 false(비활성화)로 변경
      await deviceAuth.changeDeviceStatus(deviceId, false);
      
      // 인증 실패 여부 확인
      const isAuthenticated = await deviceAuth.authenticateDevice(deviceId);
      expect(isAuthenticated).to.equal(false);
    });

    it("소유자가 아닌 계정은 기기 상태를 변경할 수 없다", async function () {
      await deviceAuth.registerDevice(deviceId);
      
      // owner가 아닌 addr1 계정으로 접속하여 상태 변경 시도 (실패해야 정상)
      await expect(
        deviceAuth.connect(addr1).changeDeviceStatus(deviceId, false)
      ).to.be.revertedWith("Only the owner can change status.");
    });
  });
});