package com.grapevine.controller;

import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.grapevine.model.User;
import com.grapevine.service.UserService;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {
    private final UserService userService;

    @PostMapping("/register")
    public String registerUser(@RequestBody User user) {
        return userService.initiateUserRegistration(user);
    }

    @PostMapping("/verify")
    public User verifyUser(@RequestParam String token, @RequestBody User user) {
        return userService.verifyAndCreateUser(token, user);
    }

    @GetMapping("/{userEmail}")
    public User getUser(@PathVariable String userEmail) {
        return userService.getUserByEmail(userEmail);
    }
}