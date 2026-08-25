package com.accessibleconnect.backend.communication.controller;

import com.accessibleconnect.backend.communication.entity.CommunicationMode;
import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import com.accessibleconnect.backend.communication.entity.CommunicationSessionStatus;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.isl.entity.TranslationSequenceHistory;
import com.accessibleconnect.backend.isl.repository.TranslationSequenceHistoryRepository;
import com.accessibleconnect.backend.user.entity.User;
import com.accessibleconnect.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class TranslationSequenceHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommunicationSessionRepository sessionRepository;

    @Autowired
    private TranslationSequenceHistoryRepository historyRepository;

    private User creator;
    private User otherUser;
    private CommunicationSession onlineSession;
    private CommunicationSession offlineSession;

    @BeforeEach
    public void setup() {
        creator = new User();
        creator.setEmail("creator@test.com");
        creator.setPasswordHash("pwd");
        creator.setName("Creator User");
        creator.setAccountType(com.accessibleconnect.backend.user.entity.AccountType.COMMON_USER);
        userRepository.save(creator);

        otherUser = new User();
        otherUser.setEmail("other@test.com");
        otherUser.setPasswordHash("pwd");
        otherUser.setName("Other User");
        otherUser.setAccountType(com.accessibleconnect.backend.user.entity.AccountType.COMMON_USER);
        userRepository.save(otherUser);

        onlineSession = new CommunicationSession();
        onlineSession.setCreator(creator);
        onlineSession.setMode(CommunicationMode.ONLINE);
        onlineSession.setStatus(CommunicationSessionStatus.ACTIVE);
        sessionRepository.save(onlineSession);

        offlineSession = new CommunicationSession();
        offlineSession.setCreator(creator);
        offlineSession.setMode(CommunicationMode.OFFLINE);
        offlineSession.setStatus(CommunicationSessionStatus.ACTIVE);
        sessionRepository.save(offlineSession);

        TranslationSequenceHistory h = new TranslationSequenceHistory(
                UUID.randomUUID(),
                "seq-1",
                onlineSession.getId(),
                "trans-1",
                "sender-1",
                1L,
                "Hello",
                "ISL",
                System.currentTimeMillis(),
                "{\"sequenceId\":\"seq-1\",\"language\":\"ISL\",\"steps\":[]}"
        );
        historyRepository.save(h);
    }

    @Test
    @WithMockUser(username = "other@test.com", roles = {"USER"})
    public void testGetOnlineSessionHistorySuccess() throws Exception {
        mockMvc.perform(get("/api/communication/sessions/" + onlineSession.getId() + "/sequences")
                        .param("afterSequence", "0")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].sequenceId").value("seq-1"));
    }

    @Test
    @WithMockUser(username = "creator@test.com", roles = {"USER"})
    public void testGetOfflineSessionHistoryByCreatorSuccess() throws Exception {
        mockMvc.perform(get("/api/communication/sessions/" + offlineSession.getId() + "/sequences")
                        .param("afterSequence", "0")
                        .param("limit", "10"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "other@test.com", roles = {"USER"})
    public void testGetOfflineSessionHistoryByOtherUserForbidden() throws Exception {
        mockMvc.perform(get("/api/communication/sessions/" + offlineSession.getId() + "/sequences")
                        .param("afterSequence", "0")
                        .param("limit", "10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "other@test.com", roles = {"USER"})
    public void testGetOnlineSessionHistoryWithLimitEnforced() throws Exception {
        // Insert more items
        for (int i = 2; i <= 5; i++) {
            TranslationSequenceHistory h = new TranslationSequenceHistory(
                    UUID.randomUUID(),
                    "seq-" + i,
                    onlineSession.getId(),
                    "trans-" + i,
                    "sender-1",
                    (long) i,
                    "Text " + i,
                    "ISL",
                    System.currentTimeMillis(),
                    "{\"sequenceId\":\"seq-" + i + "\",\"language\":\"ISL\",\"steps\":[]}"
            );
            historyRepository.save(h);
        }
        historyRepository.flush();

        mockMvc.perform(get("/api/communication/sessions/" + onlineSession.getId() + "/sequences")
                        .param("afterSequence", "0")
                        .param("limit", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}
