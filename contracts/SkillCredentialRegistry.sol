// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SkillCredentialRegistry {
    struct Credential { address subject; string skill; string level; uint16 score; bytes32 submissionHash; uint64 issuedAt; address issuer; bool revoked; }
    address public owner;
    address public trustedIssuer;
    mapping(bytes32 => Credential) private credentials;
    mapping(bytes32 => bool) public exists;
    event CredentialIssued(bytes32 indexed credentialId, address indexed subject, string skill, string level, uint16 score, bytes32 submissionHash, uint64 issuedAt, address indexed issuer);
    event CredentialRevoked(bytes32 indexed credentialId, uint64 revokedAt);
    event TrustedIssuerChanged(address indexed previousIssuer, address indexed newIssuer);
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor(address initialIssuer) { require(initialIssuer != address(0), "invalid issuer"); owner = initialIssuer; trustedIssuer = initialIssuer; }
    function setTrustedIssuer(address newIssuer) external onlyOwner { require(newIssuer != address(0), "invalid issuer"); emit TrustedIssuerChanged(trustedIssuer, newIssuer); trustedIssuer = newIssuer; }
    function claimCredential(bytes32 credentialId, string calldata skill, string calldata level, uint16 score, bytes32 submissionHash, uint64 deadline, bytes calldata signature) external {
        require(block.timestamp <= deadline, "authorization expired");
        require(score <= 100, "invalid score");
        require(!exists[credentialId], "credential exists");
        bytes32 digest = keccak256(abi.encode(address(this), block.chainid, credentialId, msg.sender, skill, level, score, submissionHash, deadline));
        require(_recover(_toEthSignedMessageHash(digest), signature) == trustedIssuer, "invalid authorization");
        exists[credentialId] = true;
        credentials[credentialId] = Credential(msg.sender, skill, level, score, submissionHash, uint64(block.timestamp), trustedIssuer, false);
        emit CredentialIssued(credentialId, msg.sender, skill, level, score, submissionHash, uint64(block.timestamp), trustedIssuer);
    }
    function revokeCredential(bytes32 credentialId) external onlyOwner { require(exists[credentialId], "credential missing"); require(!credentials[credentialId].revoked, "already revoked"); credentials[credentialId].revoked = true; emit CredentialRevoked(credentialId, uint64(block.timestamp)); }
    function getCredential(bytes32 credentialId) external view returns (Credential memory) { require(exists[credentialId], "credential missing"); return credentials[credentialId]; }
    function _toEthSignedMessageHash(bytes32 digest) private pure returns (bytes32) { return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest)); }
    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address signer) {
        require(signature.length == 65, "invalid signature length"); bytes32 r; bytes32 s; uint8 v;
        assembly { r := calldataload(signature.offset) s := calldataload(add(signature.offset, 32)) v := byte(0, calldataload(add(signature.offset, 64))) }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "invalid signature v");
        require(uint256(s) <= 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0, "invalid signature s");
        signer = ecrecover(digest, v, r, s); require(signer != address(0), "invalid signature");
    }
}
