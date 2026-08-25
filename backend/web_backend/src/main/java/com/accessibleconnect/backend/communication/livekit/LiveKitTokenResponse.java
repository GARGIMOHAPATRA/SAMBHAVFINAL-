package com.accessibleconnect.backend.communication.livekit;

public class LiveKitTokenResponse {
    private String url;
    private String token;
    private String roomName;
    private String participantIdentity;

    public LiveKitTokenResponse() {}

    public LiveKitTokenResponse(String url, String token, String roomName, String participantIdentity) {
        this.url = url;
        this.token = token;
        this.roomName = roomName;
        this.participantIdentity = participantIdentity;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getParticipantIdentity() {
        return participantIdentity;
    }

    public void setParticipantIdentity(String participantIdentity) {
        this.participantIdentity = participantIdentity;
    }
}
