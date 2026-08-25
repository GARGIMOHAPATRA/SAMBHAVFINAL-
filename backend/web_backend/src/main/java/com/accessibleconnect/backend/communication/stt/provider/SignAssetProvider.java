package com.accessibleconnect.backend.communication.stt.provider;

import com.accessibleconnect.backend.communication.stt.dto.SignAsset;

public interface SignAssetProvider {
    SignAsset resolveAsset(String conceptId);
}
