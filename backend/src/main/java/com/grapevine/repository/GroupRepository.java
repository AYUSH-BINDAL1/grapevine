package com.grapevine.repository;

import com.grapevine.model.Group;
import com.grapevine.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    List<Group> findByParticipantsContains(User user);
    List<Group> findByHostsContains(User user);

    @Query("SELECT g FROM Group g WHERE LOWER(g.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(g.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Group> searchByKeyword(@Param("keyword") String keyword);
}