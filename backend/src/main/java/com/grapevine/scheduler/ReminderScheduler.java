package com.grapevine.scheduler;

import com.grapevine.service.EventReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@EnableScheduling
@RequiredArgsConstructor
public class ReminderScheduler {

    private final EventReminderService eventReminderService;

    @Scheduled(cron = "59 * * * * *")  // Run at 59 seconds of every minute
    public void checkAndSendReminders() {
        // Calculate exact next minute boundary
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextMinute = now.plusMinutes(1).withSecond(0).withNano(0);

        // Add a brief delay to get closer to the minute boundary if needed
        long millisToNextMinute = java.time.Duration.between(now, nextMinute).toMillis();
        if (millisToNextMinute > 100) { // If we're not extremely close already
            try {
                Thread.sleep(Math.min(millisToNextMinute - 50, 900)); // Sleep until ~50ms before next minute
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Now we're very close to the minute boundary
        eventReminderService.processDueRemindersForTime(nextMinute);
    }
}