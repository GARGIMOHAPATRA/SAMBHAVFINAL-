package com.accessibleconnect.backend.isl.service;

import com.accessibleconnect.backend.isl.entity.ISLSignAsset;
import java.security.Principal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ISLSignAssetService {
    List<ISLSignAsset> getAllAssets();
    Optional<ISLSignAsset> getAssetById(UUID id);
    List<ISLSignAsset> getAssetsByConcept(String conceptId);
    ISLSignAsset createAsset(ISLSignAsset asset);
    ISLSignAsset updateAsset(UUID id, ISLSignAsset details);
    void deleteAsset(UUID id);
    ISLSignAsset uploadMedia(UUID id, byte[] fileData, String contentType, long fileSize);
    ISLSignAsset deleteMedia(UUID id);
    String generateSignedUrl(UUID id, Principal principal);
}
