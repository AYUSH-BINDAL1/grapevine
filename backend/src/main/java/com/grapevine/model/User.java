package com.grapevine.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.antlr.v4.runtime.misc.NotNull;

@Entity
@Table(name = "users")
public class User {

    @Id
    //@GeneratedValue

    @NotNull
    private String userEmail;

    @NotNull
    private String password;

    // Getters and Setters
    public String getUserEmail() {
        return userEmail;
    }
    public String getUserPassword() {
        return password;
    }
}