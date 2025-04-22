package com.grapevine.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow the specific origin
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedOrigin("http://localhost:8000"); //TODO: Delete this after frontend messaging is implemented

        // Allow all headers
        config.addAllowedHeader("*");

        // Allow all methods (GET, POST, PUT, DELETE, etc.)
        config.addAllowedMethod("*");

        // Allow cookies and auth headers
        config.setAllowCredentials(true);

        // Expose the custom Session-Id header
        config.addExposedHeader("Session-Id");

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}