package com.grapevine.constants;

public final class ApiConstants {
    // Base URLs
    public static final String LOCAL_BASE_URL = "http://localhost:8080";
    public static final String EC2_BASE_URL = "http://ec2-3-140-184-86.us-east-2.compute.amazonaws.com";

    // API Endpoints
    public static final String EVENTS_ENDPOINT = "/events";
    public static final String LOCATIONS_ENDPOINT = "/locations";
    public static final String USERS_ENDPOINT = "/users";

    // Preventing instantiation
    private ApiConstants() {
        throw new AssertionError("Utility class should not be instantiated");
    }
}