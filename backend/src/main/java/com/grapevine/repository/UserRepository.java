package com.grapevine.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.grapevine.model.User;
import java.util.List;

public interface UserRepository extends JpaRepository<User, String> {
    List<User> findAllByCourses(String courseKey);
}