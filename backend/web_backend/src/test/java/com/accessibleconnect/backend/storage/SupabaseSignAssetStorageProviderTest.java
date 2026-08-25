package com.accessibleconnect.backend.storage;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SupabaseSignAssetStorageProviderTest {

    @Test
    public void testEmptyConfigThrowsException() {
        SupabaseSignAssetStorageProvider provider = new SupabaseSignAssetStorageProvider("", "");
        
        assertThrows(IllegalStateException.class, () -> {
            provider.upload("bucket", "path", new byte[0], "video/mp4");
        });

        assertThrows(IllegalStateException.class, () -> {
            provider.generateSignedUrl("bucket", "path", 300);
        });

        assertThrows(IllegalStateException.class, () -> {
            provider.delete("bucket", "path");
        });
    }

    @Test
    public void testPlaceholderConfigThrowsException() {
        SupabaseSignAssetStorageProvider provider = new SupabaseSignAssetStorageProvider(
                "your_supabase_url", "your_service_role_key"
        );
        
        assertThrows(IllegalStateException.class, () -> {
            provider.upload("bucket", "path", new byte[0], "video/mp4");
        });
    }
}
