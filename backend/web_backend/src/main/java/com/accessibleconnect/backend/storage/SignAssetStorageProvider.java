package com.accessibleconnect.backend.storage;

public interface SignAssetStorageProvider {
    void upload(String bucket, String path, byte[] fileData, String mimeType);
    String generateSignedUrl(String bucket, String path, int expirationSeconds);
    void delete(String bucket, String path);
    boolean exists(String bucket, String path);
}
