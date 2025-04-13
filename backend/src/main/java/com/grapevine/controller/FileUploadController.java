package com.grapevine.controller;

import com.grapevine.exception.InvalidSessionException;
import com.grapevine.model.User;
import com.grapevine.service.S3Service;
import com.grapevine.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:5173")
public class FileUploadController {

    private final S3Service s3Service;
    private final UserService userService;
    private static final long MAX_PROFILE_PIC_SIZE = 2 * 1024 * 1024; // 2MB

    @Autowired
    public FileUploadController(S3Service s3Service, UserService userService) {
        this.s3Service = s3Service;
        this.userService = userService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestHeader("Session-Id") String sessionId,
            @RequestParam("file") MultipartFile file) {

        // Validate session first
        User user = userService.validateSession(sessionId);
        if (file.getSize() > MAX_PROFILE_PIC_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Profile picture must be less than 2MB");
        }
        
        try {
            String fileName = s3Service.uploadFile(file);
            String publicUrl = s3Service.getPublicUrl(fileName);

            Map<String, String> response = new HashMap<>();
            response.put("fileName", fileName);
            response.put("publicUrl", publicUrl);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/profile-picture/{userEmail}")
    public ResponseEntity<Map<String, String>> uploadProfilePicture(
            @PathVariable String userEmail,
            @RequestHeader("Session-Id") String sessionId,
            @RequestParam("file") MultipartFile file) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Check if user is modifying their own profile
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only update your own profile picture");
        }

        // Check file size
        if (file.getSize() > MAX_PROFILE_PIC_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Profile picture must be less than 2MB");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Only image files are allowed for profile pictures");
        }

        try {
            // Delete old profile picture if it exists
            if (currentUser.getProfilePictureUrl() != null) {
                String oldFileName = currentUser.getProfilePictureUrl()
                        .substring(currentUser.getProfilePictureUrl().lastIndexOf("/") + 1);
                s3Service.deleteFile(oldFileName);
            }

            // Upload new profile picture
            String fileName = s3Service.uploadFile(file);
            String publicUrl = s3Service.getPublicUrl(fileName);

            // Update user profile with new picture URL
            currentUser.setProfilePictureUrl(publicUrl);
            userService.updateUser(userEmail, currentUser);

            Map<String, String> response = new HashMap<>();
            response.put("fileName", fileName);
            response.put("publicUrl", publicUrl);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to upload profile picture: " + e.getMessage());
        }
    }

    @GetMapping("/profile-picture/{userEmail}")
    public ResponseEntity<Map<String, String>> getProfilePicture(
            @PathVariable String userEmail,
            @RequestHeader(value = "Session-Id", required = false) String sessionId) {

        // Optionally validate session if you want to restrict profile picture access
        if (sessionId != null) {
            userService.validateSession(sessionId);
        }

        // Get user and their profile picture URL
        User user = userService.getUserByEmail(userEmail);

        Map<String, String> response = new HashMap<>();
        if (user.getProfilePictureUrl() != null) {
            response.put("profilePictureUrl", user.getProfilePictureUrl());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.noContent().build();
        }
    }

    @DeleteMapping("/profile-picture/{userEmail}")
    public ResponseEntity<Void> deleteProfilePicture(
            @PathVariable String userEmail,
            @RequestHeader("Session-Id") String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Check if user is modifying their own profile
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only delete your own profile picture");
        }

        // Check if user has a profile picture
        if (currentUser.getProfilePictureUrl() == null) {
            return ResponseEntity.noContent().build();
        }

        // Extract filename from URL
        String fileName = currentUser.getProfilePictureUrl()
                .substring(currentUser.getProfilePictureUrl().lastIndexOf("/") + 1);

        // Delete file from S3
        s3Service.deleteFile(fileName);

        // Update user profile
        currentUser.setProfilePictureUrl(null);
        userService.updateUser(userEmail, currentUser);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteFile(
            @RequestHeader("Session-Id") String sessionId,
            @RequestParam("fileName") String fileName) {

        // Validate session first
        userService.validateSession(sessionId);

        s3Service.deleteFile(fileName);
        return ResponseEntity.ok().build();
    }
}