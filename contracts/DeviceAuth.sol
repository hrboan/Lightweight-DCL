// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DeviceAuth {
    // IoT 기기의 상태를 저장할 구조체
    struct Device {
        string deviceId;
        bool isActive;
        bool isRegistered;
        bool isDeleted; // UI에서 숨김 처리 및 논리적 삭제를 위한 플래그
        address owner; // 기기를 등록한 지갑 주소
    }

    // deviceId(예: "temp-001")를 입력하면 Device 구조체를 반환하는 매핑
    mapping(string => Device) public devices;

    // 등록된 전체 기기 목록을 프론트엔드에 전달하기 위한 배열
    string[] public deviceList;

    // 블록체인에 기록을 남기기 위한 이벤트
    event DeviceRegistered(string deviceId, address owner);
    event DeviceStatusChanged(string deviceId, bool isActive);
    event DeviceDeleted(string deviceId); // 삭제 이력 기록용 이벤트

    // 1. 블록체인 기반 기기 등록 (Registration)
    function registerDevice(string memory _deviceId) public {
        require(!devices[_deviceId].isRegistered, "Device is already registered.");

        devices[_deviceId] = Device({
            deviceId: _deviceId,
            isActive: true, // 등록 시 기본적으로 활성화 상태 부여
            isRegistered: true,
            isDeleted: false, // 초기 등록 시 삭제 상태는 false
            owner: msg.sender // 함수를 호출한 사람(지갑)이 소유자가 됨
        });

        deviceList.push(_deviceId); // 리스트에 기기 ID 추가
        emit DeviceRegistered(_deviceId, msg.sender);
    }

    // 2. 실시간 인증 검증 (Authentication)
    function authenticateDevice(string memory _deviceId) public view returns (bool) {
        // 기기가 등록되어 있고, 활성화 상태이며, [추가됨] 삭제되지 않았을 때만 true 반환
        return devices[_deviceId].isRegistered && devices[_deviceId].isActive && !devices[_deviceId].isDeleted;
    }

    // 3. 기기 상태 및 권한 관리 (Management)
    function changeDeviceStatus(string memory _deviceId, bool _isActive) public {
        require(devices[_deviceId].isRegistered, "Device is not registered.");
        require(devices[_deviceId].owner == msg.sender, "Only the owner can change status.");
        require(!devices[_deviceId].isDeleted, "Device is already deleted."); // [추가됨] 삭제된 기기는 상태 변경 불가

        devices[_deviceId].isActive = _isActive; // 기기 상태를 true 혹은 false로 변경

        emit DeviceStatusChanged(_deviceId, _isActive);
    }

    // 4. 기기 삭제 (논리적 삭제 - 데이터는 남기되 인증 및 UI에서 제외)
    function deleteDevice(string memory _deviceId) public {
        require(devices[_deviceId].isRegistered, "Device is not registered.");
        require(devices[_deviceId].owner == msg.sender, "Only the owner can delete.");
        require(!devices[_deviceId].isDeleted, "Device is already deleted.");

        devices[_deviceId].isDeleted = true; // 삭제 플래그만 true로 변경 (이력 보존)

        emit DeviceDeleted(_deviceId);
    }

    // 5. 전체 기기 목록 조회 (프론트엔드 리스트 출력용)
    function getAllDevices() public view returns (string[] memory) {
        return deviceList;
    }
}