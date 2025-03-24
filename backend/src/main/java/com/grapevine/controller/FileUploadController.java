package com.grapevine.controller;

import com.grapevine.exception.InvalidSessionException;
import com.grapevine.model.User;
import com.grapevine.service.S3Service;
import com.grapevine.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final S3Service s3Service;
    private final UserService userService;

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