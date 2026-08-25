package com.accessibleconnect.backend.isl.controller;

import com.accessibleconnect.backend.communication.stt.dto.AssetStatus;
import com.accessibleconnect.backend.communication.stt.dto.VerificationStatus;
import com.accessibleconnect.backend.isl.entity.ISLSignAsset;
import com.accessibleconnect.backend.isl.repository.ISLSignAssetRepository;
import com.accessibleconnect.backend.storage.SignAssetStorageProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ISLSignAssetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ISLSignAssetRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SignAssetStorageProvider storageProvider;

    private static final byte[] VALID_MP4_BYTES = new byte[] { 0, 0, 0, 0, 'f', 't', 'y', 'p', 1, 2, 3 };

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testUserCanGetAssets() throws Exception {
        mockMvc.perform(get("/api/isl/assets"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testUserCannotCreateAsset() throws Exception {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "HELLO_CONTROLLER", "HELLO_CONTROLLER", "ISL", "VIDEO", null, 1500, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test"
        );

        mockMvc.perform(post("/api/isl/assets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(asset)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    public void testAdminCanCreateAsset() throws Exception {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "HELLO_CONTROLLER", "HELLO_CONTROLLER", "ISL", "VIDEO", null, 1500, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test"
        );

        mockMvc.perform(post("/api/isl/assets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(asset)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testUserCannotDeleteAsset() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(delete("/api/isl/assets/" + id))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testUserCannotUploadMedia() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.mp4", "video/mp4", VALID_MP4_BYTES);
        UUID id = UUID.randomUUID();

        mockMvc.perform(multipart("/api/isl/assets/" + id + "/media").file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    public void testAdminCanUploadMedia() throws Exception {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "HELLO_UPLOAD", "HELLO_UPLOAD", "ISL", "VIDEO", null, 1500, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test"
        );
        ISLSignAsset saved = repository.save(asset);

        MockMultipartFile file = new MockMultipartFile("file", "test.mp4", "video/mp4", VALID_MP4_BYTES);

        mockMvc.perform(multipart("/api/isl/assets/" + saved.getId() + "/media").file(file))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    public void testAdminUploadInvalidMagicBytesRejected() throws Exception {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "HELLO_BAD", "HELLO_BAD", "ISL", "VIDEO", null, 1500, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test"
        );
        ISLSignAsset saved = repository.save(asset);

        MockMultipartFile file = new MockMultipartFile("file", "bad.mp4", "video/mp4", "invalid content".getBytes());

        mockMvc.perform(multipart("/api/isl/assets/" + saved.getId() + "/media").file(file))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testUserCannotDeleteMedia() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(delete("/api/isl/assets/" + id + "/media"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    public void testAdminCanDeleteMedia() throws Exception {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "HELLO_DELETE", "HELLO_DELETE", "ISL", "VIDEO", null, 1500, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test"
        );
        asset.setStoragePath("isl/HELLO_DELETE/v1.0/hello_delete.mp4");
        ISLSignAsset saved = repository.save(asset);

        mockMvc.perform(delete("/api/isl/assets/" + saved.getId() + "/media"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testGetMediaUrlForbiddenForUnverified() throws Exception {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "HELLO_URL", "HELLO_URL", "ISL", "VIDEO", null, 1500, "HD", 1, 0,
                AssetStatus.IN_REVIEW, VerificationStatus.IN_REVIEW, "test"
        );
        asset.setStoragePath("isl/HELLO_URL/v1.0/hello_url.mp4");
        ISLSignAsset saved = repository.save(asset);

        mockMvc.perform(get("/api/isl/assets/" + saved.getId() + "/media"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testGetMediaUrlOkForActiveAndVerified() throws Exception {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "HELLO_URL_OK", "HELLO_URL_OK", "ISL", "VIDEO", null, 1500, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test"
        );
        asset.setStoragePath("isl/HELLO_URL_OK/v1.0/hello_url_ok.mp4");
        ISLSignAsset saved = repository.save(asset);

        Mockito.when(storageProvider.generateSignedUrl(anyString(), anyString(), anyInt()))
                .thenReturn("https://supabase-signed-url.com/fake.mp4");

        mockMvc.perform(get("/api/isl/assets/" + saved.getId() + "/media"))
                .andExpect(status().isOk());
    }
}
