package com.grapevine.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

public class UserHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String query = request.getURI().getQuery();
        String userEmail = "anonymous"; // Default value

        if (query != null) {
            // Split query params and look for email
            String[] params = query.split("&");
            for (String param : params) {
                if (param.startsWith("email=")) {
                    userEmail = param.substring(6);
                    break;
                }
            }
        }

        return new StompPrincipal(userEmail);
    }

    private static class StompPrincipal implements Principal {
        private final String name;

        public StompPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}