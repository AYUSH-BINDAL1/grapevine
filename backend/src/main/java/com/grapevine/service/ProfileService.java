package com.grapevine.service;

import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.User;
import com.grapevine.repository.ProfileRepository;
import com.grapevine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    //TODO: Fix Exception and Error Handling
    public User getProfile(String userEmail) {
        return profileRepository.findById(userEmail).orElseThrow(() -> new UserNotFoundException("User not found with email: " + userEmail));
    }

    //TODO: Fix Exception and Error Handling
    public ResponseEntity<Resource> getProfilePicture(String userEmail) {
        User user = profileRepository.getReferenceById(userEmail);
        String username = userEmail.split("@")[0];

        String profilePictureFileName = "";
        byte[] profileBytes = null;

        try {
            String picturesDirectory = "pictures";

            profilePictureFileName = username + "_profile_picture.jpeg";
            Path profilePicturePath = Paths.get(picturesDirectory + "/" + profilePictureFileName);

            profileBytes = Files.readAllBytes(profilePicturePath);

        } catch (Exception e) {
            e.printStackTrace();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + profilePictureFileName + "\"")
                .body(new ByteArrayResource(profileBytes));
    }

    //TODO: Fix Exception and Error Handling
    public String setProfile(User user) {
        profileRepository.save(user);
        return null;
    }

    //TODO: Fix Exception and Error Handling
    public String setProfilePicture(String userEmail, MultipartFile profilePicture) {
        User user = profileRepository.getReferenceById(userEmail);
        String username = userEmail.split("@")[0];

        try {
            String picturesDirectory = "pictures";
            Files.createDirectories(Paths.get(picturesDirectory));

            String profilePictureFileName = username + "_profile_picture.jpeg";
            Path profilePicturePath = Paths.get(picturesDirectory + "/" + profilePictureFileName);

            Files.write(profilePicturePath, profilePicture.getBytes());

            user.setProfilePicturePath(profilePicturePath.toString());
            userRepository.save(user);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return "SUCCESS";
    }

}