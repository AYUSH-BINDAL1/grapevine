package com.grapevine.service;

import com.grapevine.model.User;
import com.grapevine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User getUserByUserEmail(String userEmail) {
        return userRepository.findByUserEmail(userEmail);
    }

    public User addUser(User user) {
        return userRepository.save(user);
    }
}