package com.grapevine.repository;

import com.grapevine.model.EventReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventReminderRepository extends JpaRepository<EventReminder, Long> {

    List<EventReminder> findByEventIdAndUserEmail(Long eventId, String userEmail);

    List<EventReminder> findByUserEmailAndSent(String userEmail, boolean sent);

    @Query("SELECT er FROM EventReminder er WHERE er.reminderTime <= :now AND er.sent = false")
    List<EventReminder> findDueReminders(LocalDateTime now);

    @Modifying
    @Query("UPDATE EventReminder er SET er.sent = true WHERE er.reminderId = :reminderId")
    void markAsSent(Long reminderId);

    @Query(value = "SELECT * FROM event_reminders r WHERE " +
            "DATE_TRUNC('minute', r.reminder_time) <= DATE_TRUNC('minute', CAST(:currentTime AS timestamp)) AND " +
            "DATE_TRUNC('minute', r.reminder_time) > DATE_TRUNC('minute', CAST(:currentTime AS timestamp) - INTERVAL '1 minute') AND " +
            "r.sent = false",
            nativeQuery = true)
    List<EventReminder> findExactDueReminders(@Param("currentTime") LocalDateTime currentTime);
}