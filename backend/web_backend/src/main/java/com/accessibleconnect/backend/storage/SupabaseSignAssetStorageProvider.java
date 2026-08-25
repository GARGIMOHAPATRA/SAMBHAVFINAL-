package com.accessibleconnect.backend.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SupabaseSignAssetStorageProvider implements SignAssetStorageProvider {
    private static final Logger log = LoggerFactory.getLogger(SupabaseSignAssetStorageProvider.class);

    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public SupabaseSignAssetStorageProvider(
            @Value("${app.supabase.url:}") String supabaseUrl,
            @Value("${app.supabase.service-role-key:}") String serviceRoleKey
    ) {
        this.supabaseUrl = supabaseUrl != null ? supabaseUrl.trim() : "";
        this.serviceRoleKey = serviceRoleKey != null ? serviceRoleKey.trim() : "";
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    private void checkConfig() {
        if (supabaseUrl.isEmpty() || serviceRoleKey.isEmpty() ||
            supabaseUrl.contains("your_") || serviceRoleKey.contains("your_")) {
            log.error("[Supabase Storage] Supabase URL or Service-Role Key is not configured in environment.");
            throw new IllegalStateException("Supabase storage is not configured. Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.");
        }
    }

    @Override
    public void upload(String bucket, String path, byte[] fileData, String mimeType) {
        checkConfig();
        log.info("[Supabase Storage] Uploading file to bucket: {}, path: {}, size: {} bytes", bucket, path, fileData.length);
        
        try {
            String url = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("Content-Type", mimeType)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(fileData))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("[Supabase Storage] Upload failed with status code: {}. Response: {}", response.statusCode(), response.body());
                throw new RuntimeException("Supabase Storage upload failed with code: " + response.statusCode());
            }
            log.info("[Supabase Storage] Upload completed successfully.");
        } catch (Exception e) {
            log.error("[Supabase Storage] Error uploading file: ", e);
            throw new RuntimeException("Storage upload error: " + e.getMessage(), e);
        }
    }

    @Override
    public String generateSignedUrl(String bucket, String path, int expirationSeconds) {
        checkConfig();
        log.info("[Supabase Storage] Creating signed URL for bucket: {}, path: {}, expiration: {} seconds", bucket, path, expirationSeconds);

        try {
            String url = supabaseUrl + "/storage/v1/object/sign/" + bucket + "/" + path;
            
            String jsonBody = objectMapper.writeValueAsString(Map.of("expiresIn", expirationSeconds));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("[Supabase Storage] Signed URL creation failed with status code: {}. Response: {}", response.statusCode(), response.body());
                throw new RuntimeException("Signed URL creation failed with code: " + response.statusCode());
            }

            Map<?, ?> respMap = objectMapper.readValue(response.body(), Map.class);
            String signedPath = (String) respMap.get("signedURL");
            if (signedPath == null) {
                signedPath = (String) respMap.get("signedUrl");
            }
            
            if (signedPath == null) {
                throw new RuntimeException("Signed URL not found in response metadata: " + response.body());
            }

            String resultUrl;
            if (signedPath.startsWith("/")) {
                resultUrl = supabaseUrl + signedPath;
            } else if (signedPath.startsWith("http")) {
                resultUrl = signedPath;
            } else {
                resultUrl = supabaseUrl + "/storage/v1" + signedPath;
            }

            log.info("[Supabase Storage] Successfully generated signed URL.");
            return resultUrl;
        } catch (Exception e) {
            log.error("[Supabase Storage] Error generating signed URL: ", e);
            throw new RuntimeException("Storage signed URL error: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String bucket, String path) {
        checkConfig();
        log.info("[Supabase Storage] Deleting file from bucket: {}, path: {}", bucket, path);

        try {
            String url = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .DELETE()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200 && response.statusCode() != 404) {
                log.error("[Supabase Storage] Delete failed with status code: {}. Response: {}", response.statusCode(), response.body());
                throw new RuntimeException("Supabase Storage delete failed with code: " + response.statusCode());
            }
            log.info("[Supabase Storage] File deleted successfully.");
        } catch (Exception e) {
            log.error("[Supabase Storage] Error deleting file: ", e);
            throw new RuntimeException("Storage delete error: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean exists(String bucket, String path) {
        checkConfig();
        log.info("[Supabase Storage] Checking file existence in bucket: {}, path: {}", bucket, path);

        try {
            String url = supabaseUrl + "/storage/v1/object/info/public/" + bucket + "/" + path;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .GET()
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.error("[Supabase Storage] Error checking file existence: ", e);
            return false;
        }
    }
}
