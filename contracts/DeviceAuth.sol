// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DeviceAuth {
    // IoT 기기의 상태를 저장할 구조체
    struct Device {
        string deviceId;
        bool isActive;
        bool isRegistered;
        address owner; // 기기를 등록한 지갑 주소
    }

    // deviceId(예: "temp-001")를 입력하면 Device 구조체를 반환하는 매핑
    mapping(string => Device) public devices;

    // 블록체인에 기록을 남기기 위한 이벤트
    event DeviceRegistered(string deviceId, address owner);
    event DeviceStatusChanged(string deviceId, bool isActive);

    // 1. 블록체인 기반 기기 등록 (Registration)
    function registerDevice(string memory _deviceId) public {
        require(!devices[_deviceId].isRegistered, "Device is already registered.");

        devices[_deviceId] = Device({
            deviceId: _deviceId,
            isActive: true, // 등록 시 기본적으로 활성화 상태 부여
            isRegistered: true,
            owner: msg.sender // 함수를 호출한 사람(지갑)이 소유자가 됨
        });

        emit DeviceRegistered(_deviceId, msg.sender);
    }

    // 2. 실시간 인증 검증 (Authentication)
    function authenticateDevice(string memory _deviceId) public view returns (bool) {
        // 기기가 등록되어 있고(isRegistered), 동시에 활성화 상태(isActive)일 때만 true 반환
        return devices[_deviceId].isRegistered && devices[_deviceId].isActive;
    }

    // 3. 기기 상태 및 권한 관리 (Management)
    function changeDeviceStatus(string memory _deviceId, bool _isActive) public {
        require(devices[_deviceId].isRegistered, "Device is not registered.");
        require(devices[_deviceId].owner == msg.sender, "Only the owner can change status.");

        devices[_deviceId].isActive = _isActive; // 기기 상태를 true 혹은 false로 변경

        emit DeviceStatusChanged(_deviceId, _isActive);
    }
}