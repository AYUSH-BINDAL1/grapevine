package com.grapevine.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_confirmations")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class EmailConfirmation {

    @Id
    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "confirmation_code", nullable = false)
    private String confirmationCode;

    @Column(name = "expiration_time", nullable = false)
    private LocalDateTime expirationTime;

    @Column(name = "email_confirmed")
    private boolean emailConfirmed = false;
}