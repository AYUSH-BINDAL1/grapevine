package com.grapevine.controller;

import com.grapevine.model.User;
import com.grapevine.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    //TODO: Fix Exception and Error Handling
    @GetMapping("/{userEmail}")
    public User getProfile(@PathVariable String userEmail) {
        return profileService.getProfile(userEmail);
    }

    //TODO: Fix Exception and Error Handling
    @GetMapping("/{userEmail}/profile-picture")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable String userEmail) {
        return profileService.getProfilePicture(userEmail);
    }

    //TODO: Fix Exception and Error Handling
    @PostMapping("/{userEmail}")
    public String setProfile(@RequestBody User user) {
        return profileService.setProfile(user);
    }

    //TODO: Fix Exception and Error Handling
    @PostMapping("{userEmail}/profile-picture")
    public String setProfilePicture(@PathVariable String userEmail, @RequestParam("file") MultipartFile profilePicture) {
        return profileService.setProfilePicture(userEmail, profilePicture);
    }

}
