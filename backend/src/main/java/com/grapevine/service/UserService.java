package com.grapevine.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.grapevine.model.User;
import com.grapevine.repository.UserRepository;
import com.grapevine.exception.UserNotFoundException;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User getUserByEmail(String userEmail) {
        return userRepository.findById(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + userEmail));
    }
}