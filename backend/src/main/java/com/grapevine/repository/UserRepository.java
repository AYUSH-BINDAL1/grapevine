package com.grapevine.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.grapevine.model.User;

public interface UserRepository extends JpaRepository<User, String> {
}