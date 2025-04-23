package com.grapevine.repository;

import com.grapevine.model.Thread;
import com.grapevine.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ThreadRepository extends JpaRepository<Thread, Long> {

    List<Thread> findAllByOrderByCreatedAtDesc();

    List<Thread> findByAuthorEmailOrderByCreatedAtDesc(String authorEmail);

    @Query("SELECT t FROM Thread t WHERE " +
            "(:major IS NULL OR t.major = :major) AND " +
            "(:course IS NULL OR t.course = :course) AND " +
            "(:authorRole IS NULL OR t.authorRole = :authorRole) " +
            "ORDER BY t.createdAt DESC")
    List<Thread> searchThreads(
            @Param("major") String major,
            @Param("course") String course,
            @Param("authorRole") User.Role authorRole);
}