package com.grapevine.controller;

import com.grapevine.model.User;
import com.grapevine.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/user")
    public User getUser(@RequestParam String userEmail) {
        return userService.getUserByUserEmail(userEmail);
    }

    @PostMapping("/user")
    public User addUser(@RequestBody User user) {
        if (user.getUserEmail() == null) {
            throw new IllegalArgumentException("User email must be provided");
        }
        return userService.addUser(user);
    }
}