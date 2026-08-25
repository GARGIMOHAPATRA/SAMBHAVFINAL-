package com.accessibleconnect.backend.isl.repository;

import com.accessibleconnect.backend.communication.stt.dto.AssetStatus;
import com.accessibleconnect.backend.isl.entity.ISLSignAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ISLSignAssetRepository extends JpaRepository<ISLSignAsset, UUID> {

    @Query("SELECT a FROM ISLSignAsset a WHERE UPPER(a.conceptId) = UPPER(:conceptId) " +
           "AND LOWER(a.language) = LOWER(:language) AND a.status = :status " +
           "ORDER BY a.versionMajor DESC, a.versionMinor DESC")
    List<ISLSignAsset> findActiveAssetsOrderByVersionDesc(
            @Param("conceptId") String conceptId,
            @Param("language") String language,
            @Param("status") AssetStatus status
    );

    List<ISLSignAsset> findByConceptIdIgnoreCase(String conceptId);

    List<ISLSignAsset> findByStatus(AssetStatus status);

    @Query("SELECT a FROM ISLSignAsset a WHERE a.verificationStatus = :vstatus")
    List<ISLSignAsset> findByVerificationStatus(@Param("vstatus") String verificationStatus);
}
